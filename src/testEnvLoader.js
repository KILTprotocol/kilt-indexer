const dotenv = require("dotenv");

// dotenv.config();

// function loadEnvironmentForTest() {
//   console.log("loading test environment...");

//   const TZ = "UTC";
//   const DB_PORT = process.env.POSTGRES_HOST_PORT;

//   console.log(`print the db_port=${DB_PORT} `);
//   return { TZ, DB_PORT };
// }

// const testEnv = loadEnvironmentForTest();

// module.exports = testEnv;

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

// // env.js
// module.exports = Promise.resolve({
//   DB_HOST: "localhost",
//   DB_PORT: 7777,
//   NODE_ENV: "development",
// });
