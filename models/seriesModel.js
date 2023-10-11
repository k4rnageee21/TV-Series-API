const mongoose = require("mongoose");
const slugify = require("slugify");

const seriesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A series must have a name"],
        unique: true,
        trim: true,
        minlength: [2, "A series name must be longer than 2 characters"],
        maxlength: [50, "A series name must be shorter than 50 characters"]
    },
    year: {
        type: Number,
        required: [true, "A series must have a year"],
        min: [1928, "A series must have a valid year"]
    },
    network: {
        type: String,
        required: [true, "A series must have a network"],
        trim: true,
        minlength: [2, "A series network name must be longer than 2 characters"],
        maxlength: [50, "A series network name must be shorter than 50 characters"]
    },
    genres: {
        type: [
            {
                type: String,
                minlength: [2, "A series genre name must be longer than 2 characters"],
                maxlength: [50, "A series genre name must be shorter than 50 characters"]
            }
        ],
        required: [true, "A series must have a genre"],
        trim: true
    },
    seasonsNumber: {
        type: Number,
        required: [true, "A series must have a seasons number"],
        min: [1, "A series must have at least one season"]
    },
    episodesNumber: {
        type: Number,
        required: [true, "A series must have an episodes number"],
        min: [1, "A series must have at least one episode"]
    },
    isAiring: {
        type: Boolean,
        default: false
    },
    cast: {
        type: [
            {
                type: String,
                minlength: [2, "A series cast name must be longer than 2 characters"],
                maxlength: [50, "A series cast name must be shorter than 50 characters"]
            }
        ],
        trim: true
    },
    createdAt: {
        type: String,
        select: false
    },
    rating: {
        type: Number,
        default: 8,
        min: [1, "A rating must be above 1.0"],
        max: [10, "A ratings must be below 10.0"]
    },
    slufigy: String
});

seriesSchema.virtual("episodesPerSeason").get(function() {
    return (this.episodesNumber / this.seasonsNumber).toFixed(2);
});

seriesSchema.pre("save", function(next) {
    this.slufigy = slugify(this.name, { lower: true });
    next();
});

seriesSchema.pre("save", function(next) {
    const f = new Intl.DateTimeFormat('en-US', {
        dateStyle: "short",
        timeStyle: "medium"
    });

    this.createdAt = f.format(new Date());
    next();
});

const Series = mongoose.model("Series", seriesSchema);

module.exports = Series;
