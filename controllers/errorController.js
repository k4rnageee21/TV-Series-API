const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFields = (err) => {
    const key = Object.keys(err.keyValue)[0];
    const value = Object.values(err.keyValue)[0];
    const message = `Duplicate field ${key}: ${value}`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(item => item.message);
    const message = `Invalid data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError("Invalid token. Please log in again", 401);

const handleJWTExpiredError = () => new AppError("Token has been expired. Please log in again", 401);

const sendDevError = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });  
};

const sendProdError = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        console.log("ERROR:", err);

        res.status(500).json({
            status: "error",
            message: "Something went wrong!"
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendDevError(err, res);
    } else if (process.env.NODE_ENV === "production") {
        let error = Object.create(err);

        if (error.name === "CastError") {
            error = handleCastErrorDB(error);
        } else if (error.code === 11000) {
            error = handleDuplicateFields(error);
        } else if (error.name === "ValidationError") {
            error = handleValidationErrorDB(error);
        } else if (error.name === "JsonWebTokenError") {
            error = handleJWTError();
        } else if (error.name === "TokenExpiredError") {
            error = handleJWTExpiredError();
        }

        sendProdError(error, res);
    }
};