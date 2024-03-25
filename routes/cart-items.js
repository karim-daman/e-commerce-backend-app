const { CartItem } = require('../models/cart-item')
const express = require('express')
const router = express.Router()

router.delete('/:id', async (req, res) => {
    try {
        const cartItem = await CartItem.findByIdAndDelete(req.params.id)

        if (!cartItem) {
            return res.status(404).send('Cart item not found!')
        }

        // Optionally, update the total price of the cart here

        res.send({ success: true, message: 'Cart item deleted successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
})

module.exports = router
