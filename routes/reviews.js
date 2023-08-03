const { Review } = require('../models/review')
const { Product } = require('../models/product')
const { User } = require('../models/user')

const express = require('express')
const router = express.Router()

router.get(`/`, async (req, res) => {
    const reviewsList = await Review.find()
    if (!reviewsList) res.status(500).json({ success: false })
    res.status(200).send(reviewsList)
})

router.get(`/:id`, async (req, res) => {
    const review = await Review.findById(req.params.id)
    if (!review)
        res.status(500).json({
            message: 'review was not found.',
        })
    res.status(200).send(review)
})

router.put(`/`, async (req, res) => {
    // res.send(req.body.comments)

    const reviewExist = await Review.findOne({
        product_id: req.body.product_id,
        user_id: req.body.user_id,
    })
    if (!reviewExist) {
        let review = new Review({
            product_id: req.body.product_id,
            user_id: req.body.user_id,
            heart: req.body.heart,
            rating: req.body.rating,
            comments: req.body.comments,
        })
        review = await review.save()
        res.send(review) // Optional: Send the created review as a response
    } else {
        reviewExist.heart = req.body.heart
        reviewExist.rating = req.body.rating
        reviewExist.comments = req.body.comments
        const updatedReview = await reviewExist.save()
        res.send(updatedReview) // Optional: Send the updated review as a response
    }
})

// when a review is deleted heart, rating and all comments are removed for a single product
router.delete('/:id', (req, res) => {
    Review.findByIdAndRemove(req.params.id)
        .then((review) => {
            if (review) {
                return res.status(200).json({
                    success: true,
                    message: `review was deleted successfully.`,
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: `review not found.`,
                })
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err })
        })
})

module.exports = router
