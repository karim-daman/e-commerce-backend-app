const { User } = require('../models/user')
const { Cart } = require('../models/cart')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-passwordHash')
    if (!userList) res.status(500).json({ success: false })
    res.send(userList)
})

router.get(`/:id`, async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash')
    if (!user)
        res.status(500).json({
            message: 'user was not found.',
        })
    res.status(200).send(user)
})

router.post(`/`, async (req, res) => {
    const checkExistance = await User.findOne({ email: req.body.email })
    if (checkExistance) {
        return res.status(400).send('user already has an account.')
    }

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })

    user = await user.save()
    if (!user) return res.status(404).send('user cannot be created!')
    res.send(user)
})

router.post(`/register`, async (req, res) => {
    const checkExistance = await User.findOne({ email: req.body.email })
    if (checkExistance) {
        return res
            .status(400)
            .send({ success: false, message: 'user already has an account.' })
    }

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: false,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })

    user = await user.save()
    if (!user)
        return res
            .status(404)
            .send({ success: false, message: 'user cannot be created!' })

    let user_cart = await Cart.findOne({ user: user.id })
    if (!user_cart)
        user_cart = await new Cart({
            cartItems: [],
            shippingAddress1: 'undefined_address',
            city: 'undefined_city',
            zip: 'undefined_zipcode',
            country: 'undefined_country',
            phone: 'undefined_phone',
            status: 'Pending',
            user: user.id,
        }).save()

    res.send({ success: true, user: user, cart: user_cart })
})

router.post(`/verify`, async (req, res) => {
    const token = req.headers.authorization

    if (!token) {
        return res.status(401).json({ error: 'No token provided' })
    }

    try {
        const decoded = jwt.verify(token, process.env.Secret)

        const currentTimestamp = Math.floor(Date.now() / 1000)
        const remainingTime = decoded.exp - currentTimestamp

        const hours = Math.floor(remainingTime / 3600)
        const minutes = Math.floor((remainingTime % 3600) / 60)
        const seconds = remainingTime % 60

        if (currentTimestamp >= decoded.exp) {
            return res.status(401).json({ error: 'Token has expired' })
        }

        res.json({
            success: true,
            message: 'Access granted',
            remainingTime: { hours, minutes, seconds },
        })
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token',
            token: req.headers.authorization,
        })
    }
})

router.post(`/login`, async (req, res) => {
    const user = await User.findOne({ email: req.body.email })

    if (!user)
        return res
            .status(400)
            .send({ success: false, messsage: 'user not found.' })

    const user_cart = await Cart.findOne({ user: user.id }).populate({
        path: 'cartItems',
        populate: {
            path: 'product',
            select: 'id image brand price name',
        },
    })

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin,
                cart: user_cart,
            },
            process.env.Secret,
            { expiresIn: '1d' }
        )
        res.status(200).send({ success: true, user: user.email, token: token })
    } else {
        res.status(400).send({ success: false, messsage: 'wrong credentials.' })
    }
})

router.put(`/:id`, async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.password, 10),
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country,
        },
        { new: true }
    )
    if (!user) return res.status(404).send('user cannot be updated!')
    res.send(user)
})

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id)
        .then((user) => {
            if (user) {
                return res.status(200).json({
                    success: true,
                    message: `${user.name} was deleted successfully.`,
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: `user not found.`,
                })
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err })
        })
})

router.get(`/get/count`, async (req, res) => {
    const userCount = await User.countDocuments()
    if (!userCount) res.status(500).json({ success: false })
    res.send({ userCount: userCount })
})

module.exports = router
