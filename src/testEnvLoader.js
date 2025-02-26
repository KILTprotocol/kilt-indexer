const dotenv = require("dotenv");

module.exports = new Promise((resolve) => {
  dotenv.config();

  console.log("loading test environment...");

  const testEnv = {
    TZ: "UTC",
    DB_PORT: process.env.POSTGRES_HOST_PORT,
  };

  console.log(
    `The test env that we are trying to pass: ${JSON.stringify(testEnv)}`
  );

  setTimeout(() => {
    resolve(testEnv);
  }, 200);
});
