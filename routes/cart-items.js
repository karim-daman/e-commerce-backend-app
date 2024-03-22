const { CartItem } = require('../models/cart-item')
const express = require('express')
const router = express.Router()

// router.delete('/:id', (req, res) => {
//     CartItem.findByIdAndRemove(req.params.id)
//         .then((item) => {
//             if (item) {
//                 return res
//                     .status(200)
//                     .json({ success: true, message: 'the item is deleted!' })
//             } else {
//                 return res
//                     .status(404)
//                     .json({ success: false, message: 'item not found!' })
//             }
//         })
//         .catch((err) => {
//             return res.status(500).json({ success: false, error: err })
//         })
// })

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
