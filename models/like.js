const mongoose = require('mongoose')

const likeSchema = new mongoose.Schema({
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
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    modified_at: {
        type: Date,
        default: Date.now,
    },
})

likeSchema.virtual('id').get(function () {
    return this._id.toHexString()
})

likeSchema.set('toJSON', {
    virtuals: true,
})

exports.Like = mongoose.model('Like', likeSchema)
