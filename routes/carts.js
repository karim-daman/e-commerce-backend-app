const { Cart } = require('../models/cart')
const express = require('express')
const router = express.Router()

router.get(`/`, async (req, res) => {
    const cartList = await Cart.find()
    if (!cartList) res.status(500).json({ success: false })
    res.send(cartList)
})

router.post(`/`, (req, res) => {})

module.exports = router
