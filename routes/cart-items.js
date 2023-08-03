const { CartItem } = require('../models/cart-item')
const express = require('express')
const router = express.Router()

router.delete('/:id', (req, res) => {
    CartItem.findByIdAndRemove(req.params.id)
        .then((item) => {
            if (item) {
                return res
                    .status(200)
                    .json({ success: true, message: 'the item is deleted!' })
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: 'item not found!' })
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err })
        })
})

module.exports = router
