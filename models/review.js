const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    user_name: {
        type: String,
    },
    heart: {
        type: Boolean,
    },
    rating: {
        type: Number,
    },
    comment: {
        text: {
            type: String,
        },

        reply: [{ type: String }],

        updated_at: {
            type: Date,
            default: Date.now,
        },

        numberoflikes: {
            type: Number,
        },

        ndislikes: {
            type: Number,
        },
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
})

reviewSchema.virtual('id').get(function () {
    return this._id.toHexString()
})

reviewSchema.set('toJSON', {
    virtuals: true,
})

exports.Review = mongoose.model('Review', reviewSchema)
