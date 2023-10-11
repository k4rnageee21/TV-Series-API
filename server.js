const mongoose = require("mongoose");
require("dotenv").config();

if (process.env.NODE_ENV === "production") {
    process.on("uncaughtException", err => {
        console.log(err.name, err.message);
        console.log("UNCAUGHT EXCEPTION! Shutting down...");
        process.exit(1);
    });
}

const app = require("./app");

const DB = process.env.DATABASE;

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(connection => console.log("DB connection successful!"));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log("App is running on port", port);
});

process.on("unhandledRejection", err => {
    console.log(err.name, err.message);
    console.log("UNHANDLED REJECTION! Shutting down...");

    server.close(() => {
        process.exit(1);
    });
})