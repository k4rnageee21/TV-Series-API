const express = require("express");

const seriesController = require("../controllers/seriesController");
const authController = require("../controllers/authController");

const router = express.Router();

router
    .route("/top-5")
    .get(
        authController.protect,
        seriesController.aliasTopSeries,
        seriesController.getAllSeries
    );

router
    .route("/longest-5")
    .get(
        authController.protect,
        seriesController.aliasLongestSeries,
        seriesController.getAllSeries
    );

router
    .route("/series-stats-by-network")
    .get(
        authController.protect,
        seriesController.getSeriesByNetwork
    );

router
    .route("/")
    .get(
        authController.protect,
        seriesController.getAllSeries
    )
    .post(
        authController.protect,
        authController.restrictTo("admin"),
        seriesController.createNewSeries
    );

router
    .route("/:id")
    .get(
        authController.protect,
        seriesController.getSeries
    )
    .patch(
        authController.protect,
        authController.restrictTo("admin"),
        seriesController.updateSeries
    )
    .delete(
        authController.protect,
        authController.restrictTo("admin"),
        seriesController.deleteSeries
    );

module.exports = router;