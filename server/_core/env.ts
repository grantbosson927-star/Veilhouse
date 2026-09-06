function read(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

export const ENV = {
  get appId() {
    return read("VITE_APP_ID", "veilhouse");
  },
  get cookieSecret() {
    return read("JWT_SECRET") || read("COOKIE_SECRET") || "veilhouse-dev-secret";
  },
  get databaseUrl() {
    return read("DATABASE_URL");
  },
  get oAuthServerUrl() {
    return read("OAUTH_SERVER_URL");
  },
  get ownerOpenId() {
    return read("OWNER_OPEN_ID");
  },
  get ownerName() {
    return read("OWNER_NAME");
  },
  get curatorEmail() {
    return read("CURATOR_EMAIL", "brilliantelay5@gmail.com").toLowerCase();
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get forgeApiUrl() {
    return read("BUILT_IN_FORGE_API_URL");
  },
  get forgeApiKey() {
    return read("BUILT_IN_FORGE_API_KEY");
  },
};
