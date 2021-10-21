import { Files, cookie } from "../utils";
import { PrismicConfigPath } from "./paths";

export interface AuthConfig {
  base: string;
  cookies: string;
  oauthAccessToken?: string;
  authUrl?: string;
}

const DEFAULT_CONFIG: AuthConfig = { base: "https://prismic.io", cookies: "" };

export function createDefaultAuthConfig(directory?: string): AuthConfig {
  const configPath = PrismicConfigPath(directory);
  Files.write(configPath, JSON.stringify(DEFAULT_CONFIG, null, "\t"), {
    recursive: false,
  });
  return DEFAULT_CONFIG;
}

export function getOrCreateAuthConfig(directory?: string): AuthConfig {
  const configPath = PrismicConfigPath(directory);
  if (!Files.exists(configPath)) return createDefaultAuthConfig(directory);

  const conf = Files.readJson(configPath);
  return { ...DEFAULT_CONFIG, ...conf } as AuthConfig;
}

export function removeAuthConfig(directory?: string): void {
  const configPath = PrismicConfigPath(directory);
  return Files.remove(configPath);
}

export function setAuthConfig(
  cookies: ReadonlyArray<string> = [],
  base?: string,
  directory?: string
): void {
  const currentConfig = getOrCreateAuthConfig(directory);
  const formattedCookies = formatCookies(cookies);
  const configPath = PrismicConfigPath(directory);

  const newConfig = {
    cookies: formattedCookies,
    base: !!base ? base : currentConfig.base,
  };

  return Files.write(
    configPath,
    { ...currentConfig, ...newConfig },
    { recursive: false }
  );
}

function formatCookies(cookies: ReadonlyArray<string>) {
  const newCookiesMap = cookies
    .map((str) => cookie.parse(str))
    .reduce((acc, curr) => {
      return { ...acc, ...curr };
    }, {});

  return Object.entries(newCookiesMap)
    .map(([key, value]) => {
      return cookie.serialize(key, value);
    })
    .join("; ");
}
