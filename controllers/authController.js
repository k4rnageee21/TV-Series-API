const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const optionsObject = {
        httpOnly: true,
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000)
    };

    if (process.env.NODE_ENV === "production") optionsObject.secure = true;

    res.cookie("jwt", token, optionsObject);

    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    createAndSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
    // 1) Check if there are email and password
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Please enter email and password.", 400));
    }

    // 2) Check if user exists and password is correct

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password))) {
        return next(new AppError("Please enter correct email and password", 401));
    }

    // 3) If everything is fine - send token
    createAndSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else {
        return next(new AppError("You are not logged in! Please log in to get access.", 401));
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError("The user belonging to this token does no longer exist.", 401));
    }

    // 4) Check if user changed the password after the JWT was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError("The user recently changed the password! Please log in again.", 401));
    }

    req.user = currentUser; // very IMPORTANT step
    next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return next(new AppError("You don't have permission to this resourse", 403));
    }

    next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Check if there is email
    if (!req.body.email) {
        return next(new AppError("Enter your email please", 400));
    }

    // 2) If email is here - check if user with this email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError("There are no user with this email", 404));
    }

    // 3) Generate the random token
    const resetToken = user.createPasswordResetToken();
    user.save({ validateBeforeSave: false });
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and 
    passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    // 4) If error occured, it's not enough to just send an error. We need to delete passwordResetToken
    // and passwordResetExpires from the document\

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 mins)",
            message
        });

        res.status(200).json({
            status: "success",
            message: "Check your email for reset token! You have 10 mins to use it!"
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(err);

        return next(new AppError("There was an error sending the email. Try again later!", 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get reset token
    let resetToken = req.params.token;

    // 2) Check if valid and find user by this token
    resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
        passwordResetToken: resetToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError("Invalid or expired reset token", 400));
    }

    // 3) Set the new password and remove password reset fields
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 4) Update changedPasswordAt in presave middleware
    // 5) Sign and send JWT (login the user)
    createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get the user from the collection
    const user = await User.findById(req.user._id).select("+password");

    // 2) Check if PATCHed password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent))) {
        return next(new AppError("Wrong password! Enter correct password please", 401));
    }

    // 3) Update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Login user
    createAndSendToken(user, 200, res);
});