import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { exec } from "node:child_process";

const port = 8765;
const redirectUrl = `http://127.0.0.1:${port}/manifest-callback`;
const manifest = {
  name: "Veilhouse",
  url: "https://veilhouse.monster",
  description: "Veilhouse curator sign-in",
  redirect_url: redirectUrl,
  callback_urls: ["https://veilhouse.monster/api/auth/github/callback"],
  public: false,
  request_oauth_on_install: true,
  default_permissions: {},
};

const formHtml = `<!doctype html>
<html><body>
<form id="f" action="https://github.com/settings/apps/new" method="post">
  <input type="hidden" name="manifest" id="manifest">
</form>
<script>
  document.getElementById("manifest").value = ${JSON.stringify(JSON.stringify(manifest))};
  document.getElementById("f").submit();
</script>
<p>Redirecting to GitHub to register the Veilhouse app…</p>
</body></html>`;

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(formHtml);
    return;
  }
  if (url.pathname === "/manifest-callback") {
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing code");
      return;
    }
    const converted = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
      method: "POST",
      headers: { Accept: "application/vnd.github+json", "User-Agent": "veilhouse" },
    });
    const body = await converted.json();
    if (!converted.ok) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
      process.stderr.write(JSON.stringify(body) + "\n");
      process.exit(1);
    }
    const out = {
      client_id: body.client_id,
      client_secret: body.client_secret,
      slug: body.slug,
      html_url: body.html_url,
    };
    writeFileSync(resolve(process.cwd(), ".github-oauth.json"), JSON.stringify(out, null, 2));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<p>Veilhouse GitHub app registered. You can close this tab.</p>");
    process.stdout.write("REGISTERED\n");
    process.exit(0);
  }
  res.writeHead(404);
  res.end();
});

server.listen(port, "127.0.0.1", () => {
  const page = `http://127.0.0.1:${port}/`;
  process.stdout.write(`Open ${page}\n`);
  const cmd = process.platform === "win32" ? `start "" "${page}"` : `open "${page}"`;
  exec(cmd);
});

setTimeout(() => {
  process.stderr.write("Timed out waiting for GitHub app registration\n");
  process.exit(1);
}, 180000);
