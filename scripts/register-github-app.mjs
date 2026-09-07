import { createServer } from "node:http";
import { writeFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const PORT = 8788;
const redirectUrl = `http://127.0.0.1:${PORT}/callback`;
const secretsPath = new URL("../.github-oauth-secrets.json", import.meta.url);
const donePath = new URL("../.github-oauth.json", import.meta.url);

const manifest = {
  name: "VeilhouseMonsterLogin",
  url: "https://veilhouse.monster",
  redirect_url: redirectUrl,
  callback_urls: ["https://veilhouse.monster/api/auth/github/callback"],
  description: "GitHub login for Veilhouse residents on veilhouse.monster.",
  public: true,
  default_permissions: {
    emails: "read",
  },
};

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Register Veilhouse GitHub App</title>
  <style>
    body { font-family: Georgia, serif; background: #140c0c; color: #f4ece4; padding: 48px; }
    button { font: inherit; padding: 12px 18px; cursor: pointer; }
    p { max-width: 40rem; line-height: 1.5; }
  </style>
</head>
<body>
  <p>GitHub will ask you to create the Veilhouse login app. Sign in if needed, keep the callback URL as given, then click <strong>Create GitHub App</strong>.</p>
  <form id="manifest-form" action="https://github.com/settings/apps/new" method="post">
    <input type="hidden" name="manifest" />
    <button type="submit">Create GitHub App</button>
  </form>
  <script>
    document.querySelector("[name=manifest]").value = ${JSON.stringify(JSON.stringify(manifest))};
    document.getElementById("manifest-form").submit();
  </script>
</body>
</html>`;

function send(res, status, body, contentType = "text/html; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname === "/" || url.pathname === "/register") {
    send(res, 200, page);
    return;
  }
  if (url.pathname !== "/callback") {
    send(res, 404, "Not found");
    return;
  }
  const code = url.searchParams.get("code") || "";
  if (!code) {
    send(res, 400, "GitHub did not return a registration code.");
    return;
  }
  try {
    const conversion = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
      method: "POST",
      headers: { Accept: "application/vnd.github+json", "User-Agent": "Veilhouse" },
    });
    const payload = await conversion.json();
    if (!conversion.ok || !payload.client_id || !payload.client_secret) {
      send(res, 500, "GitHub App conversion failed. Close this tab and run the registrar again.");
      console.error("GitHub App conversion failed", conversion.status);
      process.exitCode = 1;
      server.close();
      return;
    }
    const secrets = {
      GITHUB_CLIENT_ID: payload.client_id,
      GITHUB_CLIENT_SECRET: payload.client_secret,
    };
    writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
    writeFileSync(
      donePath,
      JSON.stringify(
        {
          slug: payload.slug,
          html_url: payload.html_url,
          client_id: payload.client_id,
          callback: "https://veilhouse.monster/api/auth/github/callback",
        },
        null,
        2,
      ),
    );
    send(
      res,
      200,
      "<!doctype html><html><body style='font-family:Georgia;background:#140c0c;color:#f4ece4;padding:48px'><p>Veilhouse GitHub login is registered. You can close this tab.</p></body></html>",
    );
    console.log(`GitHub App registered slug=${payload.slug || "unknown"} client_id_prefix=${String(payload.client_id).slice(0, 8)}`);
    server.close(() => process.exit(0));
  } catch (error) {
    send(res, 500, "The registrar could not finish the GitHub App handshake.");
    console.error(error);
    process.exitCode = 1;
    server.close();
  }
});

function openBrowser(startUrl) {
  const brave = join(homedir(), "AppData/Local/BraveSoftware/Brave-Browser/Application/brave.exe");
  if (existsSync(brave)) {
    spawn(brave, [startUrl], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("cmd", ["/c", "start", "", startUrl], { detached: true, stdio: "ignore" }).unref();
}

server.listen(PORT, "127.0.0.1", () => {
  const startUrl = `http://127.0.0.1:${PORT}/`;
  console.log(`Open ${startUrl} and click Create GitHub App if the form does not submit.`);
  openBrowser(startUrl);
});

