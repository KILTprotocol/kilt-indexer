const dotenv = require("dotenv");

module.exports = new Promise((resolve) => {
  dotenv.config();

  const testEnv = {
    TZ: "UTC",
    DB_PORT: process.env.POSTGRES_HOST_PORT,
  };

  console.log(
    `Passing this environment variables for the tests: ${JSON.stringify(
      testEnv
    )}`
  );

  setTimeout(() => {
    resolve(testEnv);
  }, 200);
});
