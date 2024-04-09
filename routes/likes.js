const { Like } = require('../models/like')

const express = require('express')
const router = express.Router()

router.get(`/`, async (req, res) => {
    try {
        const likesList = await Like.find()
        res.status(200).send(likesList)
    } catch (error) {
        console.error('Error fetching likes:', error)
        res.status(500).json({ success: false })
    }
})

router.get(`/:id`, async (req, res) => {
    const like = await Like.findById(req.params.id)
    if (!like)
        res.status(500).json({
            message: 'like was not found.',
        })
    res.status(200).send(like)
})

router.put(`/`, async (req, res) => {
    const likeExist = await Like.findOne({
        product_id: req.body.product_id,
        user_id: req.body.user_id,
    })
    if (!likeExist) {
        let like = new Like({
            product_id: req.body.product_id,
            user_id: req.body.user_id,
            // heart: req.body.heart,
            heart: true,
        })
        like = await like.save()
        res.send({ success: true, like })
    } else {
        console.log(likeExist)

        likeExist.heart = !likeExist.heart
        const updatedLike = await likeExist.save()
        res.send({ success: true, updatedLike })
    }
})

router.delete(`/:id`, async (req, res) => {
    try {
        const likeExist = await Like.findByIdAndDelete(req.params.id)

        if (!likeExist) {
            return res.status(404).send('Cart item not found!')
        }

        // Optionally, update the total price of the cart here

        res.send({ success: true, message: 'Like deleted successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
})

module.exports = router
