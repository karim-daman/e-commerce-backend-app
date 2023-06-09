const { Category } = require('../models/category')
const express = require('express')
const router = express.Router()

router.get(`/`, async (req, res) => {
    const categoryList = await Category.find()
    if (!categoryList) res.status(500).json({ success: false })
    res.status(200).send(categoryList)
})

router.get(`/:id`, async (req, res) => {
    const category = await Category.findById(req.params.id)
    if (!category)
        res.status(500).json({
            message: 'catogory was not found.',
        })
    res.status(200).send(category)
})

router.put(`/:id`, async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color,
        },
        { new: true }
    )
    if (!category) return res.status(404).send('category cannot be updated!')
    res.send(category)
})

router.post(`/`, async (req, res) => {
    let exists = false
    const categoryList = await Category.find()
    categoryList.map((item) => {
        if (item.name == req.body.name) exists = true
    })

    if (exists) {
        return res
            .status(403)
            .send({ success: false, message: 'category already exists.' })
    }

    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
    })

    category = await category.save()
    if (!category) {
        return res
            .status(404)
            .send({ success: false, message: 'category cannot be created!' })
    }
    res.send({ success: true, category })
})

//DELETE ...api/v1/2
router.delete('/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id)
        .then((category) => {
            if (category) {
                return res.status(200).json({
                    success: true,
                    message: `${category.name} was deleted successfully.`,
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: `category not found.`,
                })
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err })
        })
})

module.exports = router
