const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const filterObj = (obj, ...allowedFields) => {
    const result = {};
    const keys = Object.keys(obj);
    keys.forEach(key => {
        if (allowedFields.includes(key)) {
            result[key] = obj[key];
        }
    });

    return result;
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: "success",
        results: users.length,
        data: {
            users
        }
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError("Can't find user with this ID.", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            user
        }
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Send error if user PATCHed password
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("This route can't change password. Please use /updatePassword instead", 400));
    }

    // 2) Update user document with filtered body
    const filteredBody = filterObj(req.body, "name", "email");

    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        runValidators: true,
        new: true
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    // 1) Get and hide user from the collection
    const user = await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
        status: "success",
        data: null
    });
});