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
    heart: {
        type: Boolean,
    },
    rating: {
        type: Number,
    },
    comments: [
        {
            text: {
                type: String,
            },
            created_at: {
                type: Date,
                default: Date.now,
            },
            updated_at: {
                type: Date,
                default: Date.now,
            },
        },
    ],
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
