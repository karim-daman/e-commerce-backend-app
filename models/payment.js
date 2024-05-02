const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'canceled'],
        default: 'pending',
    },
    method: {
        type: String,
        required: true,
    },
    details: {
        type: String,
    },
})

paymentSchema.virtual('id').get(function () {
    return this._id.toHexString()
})

paymentSchema.set('toJSON', {
    virtuals: true,
})

exports.Payment = mongoose.model('Payment', paymentSchema)
