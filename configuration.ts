import dotenv from "dotenv";

dotenv.config();

export const DWELLIR_KEY = loadEnv("DWELLIR_KEY");
export const ONFINALITY_KEY = loadEnv("ONFINALITY_KEY");

function loadEnv(name: string) {
  const envValue = process.env[name];
  if (!envValue) {
    throw new Error(
      `Environment constant '${name}' is missing. Define it on the project's root directory '.env'-file. \n`
    );
  }
  return envValue;
}
