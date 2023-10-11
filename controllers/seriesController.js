const Series = require("../models/seriesModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.aliasTopSeries = (req, res, next) => {
    req.query.sort = "-rating";
    req.query.limit = 5;
    req.query.fields = "name year rating network";
    next();
};

exports.aliasLongestSeries = (req, res, next) => {
    req.query.sort = "-episodesNumber";
    req.query.limit = 5;
    req.query.fields = "name year rating network seasonsNumber episodesNumber";
    next();
};

exports.getAllSeries = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Series.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const series = await features.query;

    res.status(200).json({
        status: "success",
        results: series.length,
        data: {
            series
        }
    });
});

exports.getSeries = catchAsync(async (req, res, next) => {
    const series = await Series.findById(req.params.id);

    if (!series) {
        return next(new AppError(`Can't find series with this ID`, 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            series
        }
    });
});

exports.createNewSeries = catchAsync(async (req, res, next) => {
    const newSeries = await Series.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            series: newSeries
        }
    });
});

exports.updateSeries = async (req, res, next) => {
    const series = await Series.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!series) {
        return next(new AppError(`Can't find series with this ID`, 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            series
        }
    });
};

exports.deleteSeries = catchAsync(async (req, res, next) => {
    const series = await Series.findByIdAndDelete(req.params.id);

    if (!series) {
        return next(new AppError(`Can't find series with this ID`, 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    });
});

exports.getSeriesByNetwork = catchAsync(async (req, res, next) => {
    const networks = await Series.aggregate([
        {
            $match: {}
        },
        {
            $group: {
                _id: "$network",
                seasonsAverageNumber: { $avg: "$seasonsNumber" },
                episodesAverageNumber: { $avg: "$episodesNumber" },
                ratingAverage: { $avg: "$rating" },
                total: { $sum: 1 }
            }
        },
        {
            $sort: { ratingAverage: -1 }
        }
    ]);

    res.status(200).json({
        status: "success",
        total: networks.length,
        data: networks
    });
});