const mongoose = require('mongoose')

const discountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        code: {
            type: String,
            required: true,
            unique: true,
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed'], // Types of discounts: percentage or fixed amount
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 0, // Minimum value for the discount amount
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Reference to the Category model
        },
        priceRange: {
            min: {
                type: Number,
                value: 0,
            },
            max: {
                type: Number,
                value: 0,
            },
        },
        active: {
            type: Boolean,
            default: true,
        },

        // Other fields such as description, usage limits, etc. can be added as needed
    },
    { timestamps: true }
)

discountSchema.virtual('id').get(function () {
    return this._id.toHexString()
})

discountSchema.set('toJSON', {
    virtuals: true,
})

exports.Discount = mongoose.model('Discount', discountSchema)
