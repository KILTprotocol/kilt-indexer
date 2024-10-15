import dotenv from "dotenv";

dotenv.config();

export const START_BLOCK = parseInt(loadEnv("START_BLOCK", false) ?? "1");
export const RPC_ENDPOINTS = loadEnv("RPC_ENDPOINTS") as string;
export const CRAWL_PEREGRINE = isTrue(loadEnv("CRAWL_PEREGRINE", false));
export const PRIVATE_NODE_ENABLE = isTrue(
  loadEnv("PRIVATE_NODE_ENABLE", false)
);
export const PRIVATE_NODE_NET_NAME = loadEnv("PRIVATE_NODE_NET_NAME", false);
export const POSTGRES_HOST_PORT = loadEnv("POSTGRES_HOST_PORT", false);
export const GRAPHQL_HOST_PORT = loadEnv("GRAPHQL_HOST_PORT", false);

function loadEnv(name: string, compulsory: boolean = true) {
  const envValue = process.env[name];
  if (!envValue && compulsory) {
    throw new Error(
      `Environment constant '${name}' is missing. Define it on the project's root directory '.env'-file. \n`
    );
  }
  if (!envValue) {
    console.log(
      `Environment constant '${name}' is missing from '.env'-file. Working with default fallback.  \n`
    );
  }
  return envValue;
}

function isTrue(variable?: string): boolean {
  return String(variable).toUpperCase() === "TRUE";
}
