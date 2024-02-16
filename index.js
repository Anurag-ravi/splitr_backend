const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
require("./src/models/expense");
require("./src/models/payment");
require("./src/models/usermodel");
require("./src/models/trip");
require("./src/models/trip_user");
require("./src/models/log");
const config = require("./src/config/config");
const Logging = require("./src/utilities/logging");
const Log = require("./src/models/log");
const router = express();

/** Connect to Mongo */
mongoose
  .set("strictQuery", true)
  .connect(config.MONGODB_URI, {})
  .then(() => {
    Logging.success("Mongo connected successfully.");
    StartServer();
  })
  .catch((error) => Logging.error(error));

/** Only Start Server if Mongoose Connects */
const StartServer = () => {
  /** Log the request */
  router.use((req, res, next) => {
    /** Log the req */
    Logging.info(`Incoming - [${req.method} ${req.url}]`);

    res.on("finish", () => {
      /** Log the res */
      Logging.info(
        `Result : [${req.method} ${req.url}] - STATUS: ${res.statusCode}`
      );
    });

    next();
  });

  router.use(express.urlencoded({ extended: false }));
  router.use(express.json());
  router.use(cors());

  /** Routes */

  router.get("/", (req, res) => {
    res.status(200).json({ hello: "world" });
  });
  router.get("/demo", (req, res) => {
    res.status(200).json({ demo: "demo" });
  });
  router.post("/log", async (req, res) => {
    const { message } = req.body;
    if (!message)
      return res.json({ status: 400, message: "Missing parameters" });
    await Log.create({ message });
    return res.json({ status: 200, message: "Log created successfully" });
  });
  router.use("/auth", require("./src/routes/login"));
  router.use("/trip", require("./src/routes/trip"));
  router.use("/expense", require("./src/routes/expense"));
  router.use("/payment", require("./src/routes/payment"));

  const httpServer = http.createServer(router);
  httpServer.listen(config.PORT, () => {
    Logging.verbose(`Server is running on port ${config.PORT}`);
  });
};
