const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Enter your name please"],
        minlength: [3, "User name must be longer than 3 characters"],
        maxlength: [40, "User name must be shorter than 40 characters"]
    },
    email: {
        type: String,
        required: [true, "Enter your email please"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Enter correct email please"]
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    image: String,
    password: {
        type: String,
        required: [true, "Create a password please"],
        minlength: [8, "User password must be longer than 8 characters"],
        maxlength: [30, "User password must be shorter than 30 characters"],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "Confirm your password please"],
        validate: {
            validator: function(val) {
                return this.password === val;
            },
            message: "Passwords are not the same"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();
});

userSchema.pre("save", function(next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;