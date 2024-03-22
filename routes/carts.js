const { Cart } = require('../models/cart')
const { CartItem } = require('../models/cart-item')
const express = require('express')
const router = express.Router()

router.get(`/`, async (req, res) => {
    const cartList = await Cart.find()
        .populate('user', 'name email')
        .populate({
            path: 'cartItems',
            populate: {
                path: 'product',
                populate: 'category',
            },
        })
        .sort({ dateOrdered: -1 })
    if (!cartList) res.status(500).json({ success: false })
    res.send(cartList)
})

router.get(`/:id`, async (req, res) => {
    const cart = await Cart.findById(req.params.id)
        .populate('user', 'name email')
        .populate({
            path: 'cartItems',
            populate: {
                path: 'product',
                select: 'id image brand price name',
            },
        })

    // Calculate total price
    let totalPrice = 0
    for (let item of cart.cartItems) {
        totalPrice += item.quantity * item.product.price
    }

    totalPrice = Math.round((totalPrice + Number.EPSILON) * 100) / 100

    // Update total price in cart
    cart.totalPrice = totalPrice

    await cart.save()

    if (!cart) {
        res.status(500).json({ success: false })
    }
    res.send(cart)
})

router.get('/clear/:id', async (req, res) => {
    const cart = await Cart.findById(req.params.id).populate({
        path: 'cartItems',
        populate: {
            path: 'product',
            select: 'id image brand price name',
        },
    })

    if (!cart) return res.status(404).send('Cart not found!')

    cart.cartItems = [] // Remove all cart items by assigning an empty array

    await cart.save()

    res.send(cart)
})

router.put('/:id', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.id).populate({
            path: 'cartItems',
            populate: {
                path: 'product',
                select: 'id image brand price name',
            },
        })

        if (!cart) return res.status(404).send('Cart not found!')

        let foundCartItem = false

        for (let item of cart.cartItems) {
            if (item.product.id === req.body.product) {
                item.quantity++
                await item.save()
                foundCartItem = true
                break
            }
        }

        if (!foundCartItem) {
            const newCartItem = new CartItem({
                quantity: req.body.quantity,
                product: req.body.product,
            })
            cart.cartItems.push(newCartItem)
            await newCartItem.save()
        }

        // Calculate total price
        let totalPrice = 0
        for (let item of cart.cartItems) {
            totalPrice += item.quantity * item.product.price
        }

        totalPrice = Math.round((totalPrice + Number.EPSILON) * 100) / 100

        // Update total price in cart
        cart.totalPrice = totalPrice

        await cart.save()

        res.send({ success: true, cart: cart })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
})

router.post(`/`, async (req, res) => {
    const cartItems = Promise.all(
        req.body.cartItems.map(async (cartItem) => {
            let newCartItem = new CartItem({
                quantity: cartItem.quantity,
                product: cartItem.product,
            })

            newCartItem = await newCartItem.save()
            return newCartItem
        })
    )

    const resolvedCartItems = await cartItems

    const eachCartItemTotal = await Promise.all(
        resolvedCartItems.map(async (cartItem) => {
            const item = await CartItem.findById(cartItem._id).populate(
                'product',
                'price'
            )
            const totalPrice = item.product.price * item.quantity
            return totalPrice
        })
    )

    const totalPrice = eachCartItemTotal.reduce((a, b) => a + b, 0)

    let cart = new Cart({
        cartItems: resolvedCartItems,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    })

    cart = await cart.save()
    if (!cart) return res.status(404).send('cart cannot be created!')
    res.send({ sucess: true, cart: cart })
})

router.delete('/:id', (req, res) => {
    Cart.findByIdAndRemove(req.params.id)
        .then(async (cart) => {
            if (cart) {
                await cart.cartItems.map(async (orderItem) => {
                    await CartItem.findByIdAndRemove(orderItem)
                })
                return res
                    .status(200)
                    .json({ success: true, message: 'the cart is deleted!' })
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: 'cart not found!' })
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err })
        })
})

// this is the old cart post method
// router.post(`/`, async (req, res) => {
//     const cartItemIds = Promise.all(
//         req.body.cartItems.map(async (cartItem) => {
//             let newCartItem = new CartItem({
//                 quantity: cartItem.quantity,
//                 product: cartItem.product,
//             })

//             newCartItem = await newCartItem.save()
//             return newCartItem._id
//         })
//     )

//     const resolvedCartItemIds = await cartItemIds

//     const eachCartItemTotal = await Promise.all(
//         resolvedCartItemIds.map(async (cartItemId) => {
//             const cartItem = await CartItem.findById(cartItemId).populate(
//                 'product',
//                 'price'
//             )
//             const totalPrice = cartItem.product.price * cartItem.quantity
//             return totalPrice
//         })
//     )

//     const totalPrice = eachCartItemTotal.reduce((a, b) => a + b, 0)

//     let cart = new Cart({
//         cartItems: resolvedCartItemIds,
//         shippingAddress1: req.body.shippingAddress1,
//         shippingAddress2: req.body.shippingAddress2,
//         city: req.body.city,
//         zip: req.body.zip,
//         country: req.body.country,
//         phone: req.body.phone,
//         status: req.body.status,
//         totalPrice: totalPrice,
//         user: req.body.user,
//     })

//     cart = await cart.save()
//     if (!cart) return res.status(404).send('cart cannot be created!')
//     res.send(cart)
// })

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Cart.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } },
    ])

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({ totalsales: totalSales.pop().totalsales })
})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Cart.countDocuments()

    if (!orderCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        orderCount: orderCount,
    })
})

router.get(`/get/userorders/:userid`, async (req, res) => {
    const userCartList = await Cart.find({ user: req.params.userid })
        .populate({
            path: 'cartItems',
            populate: {
                path: 'product',
                populate: 'category',
            },
        })
        .sort({ dateOrdered: -1 })

    if (!userCartList) {
        res.status(500).json({ success: false })
    }
    res.send(userCartList)
})

module.exports = router
