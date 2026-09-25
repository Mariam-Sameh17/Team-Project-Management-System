const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const userRouter = require("./routes/userRoutes");
const projectRouter = require("./routes/projectRoutes");

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);

module.exports = app;
