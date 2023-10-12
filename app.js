const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const seriesRouter = require("./routes/seriesRouter");
const userRouter = require("./routes/userRouter");

const app = express();

// 1) GLOBAL MIDDLEWARES
// Setting security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from the same IP. Try again later"
});

app.use("/api", limiter);

// Body parser -> req.body
app.use(express.json({ limit: "10kb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Preventing parameter pollution
const hppWhitelist = ["isAiring", "rating", "name", "year", "network", "episodesNumber", "seasonsNumber"];
app.use(hpp({
    whitelist: hppWhitelist
}));

// 2) ROUTES

app.use("/api/v1/series", seriesRouter);
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;