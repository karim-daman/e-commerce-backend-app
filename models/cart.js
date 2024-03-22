const mongoose = require('mongoose')

const cartSchema = mongoose.Schema({
    cartItems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CartItem',
            required: true,
        },
    ],
    shippingAddress1: {
        type: String,
        required: true,
    },
    shippingAddress2: {
        type: String,
    },
    city: {
        type: String,
        required: true,
    },
    zip: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'Pending',
    },
    totalPrice: {
        type: mongoose.Schema.Types.Decimal128,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dateOrdered: {
        type: Date,
        default: Date.now,
    },
})

cartSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.totalPrice = parseFloat(ret.totalPrice.toString())
        return ret
    },
})

cartSchema.virtual('id').get(function () {
    return this._id.toHexString()
})

cartSchema.set('toJSON', {
    virtuals: true,
})

exports.Cart = mongoose.model('Cart', cartSchema)

/**
Order Example:

{
    "orderItems" : [
        {
            "quantity": 3,
            "product" : "5fcfc406ae79b0a6a90d2585"
        },
        {
            "quantity": 2,
            "product" : "5fd293c7d3abe7295b1403c4"
        }
    ],
    "shippingAddress1" : "Flowers Street , 45",
    "shippingAddress2" : "1-B",
    "city": "Prague",
    "zip": "00000",
    "country": "Czech Republic",
    "phone": "+420702241333",
    "user": "5fd51bc7e39ba856244a3b44"
}

 */
