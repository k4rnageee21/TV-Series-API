const express = require("express");
const morgan = require("morgan");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const seriesRouter = require("./routes/seriesRouter");
const userRouter = require("./routes/userRouter");

const app = express();

// 1) GENERAL MIDDLEWARES

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(express.json());

// 2) ROUTES

app.use("/api/v1/series", seriesRouter);
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;