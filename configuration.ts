import dotenv from "dotenv";

dotenv.config();

export const DWELLIR_KEY = loadEnv("DWELLIR_KEY", false);
export const ONFINALITY_KEY = loadEnv("ONFINALITY_KEY", false);
export const CRAWL_PEREGRINE = loadEnv("CRAWL_PEREGRINE", false);

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
