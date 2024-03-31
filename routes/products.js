const { Category } = require('../models/category')
const { Product } = require('../models/product')
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')

// const { S3Client } = require('@aws-sdk/client-s3')
// const multerS3 = require('multer-s3')
const firebase = require('firebase/app')
const {
    getStorage,
    ref,
    getDownloadURL,
    uploadBytesResumable,
    deleteObject,
    uploadBytes,
} = require('firebase/storage')
const { log } = require('console')
const { async } = require('@firebase/util')

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    databaseURL: process.env.FIRESTORE_DB_URL,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
}

firebase.initializeApp(firebaseConfig)

const storage = getStorage()

const upload = multer({ storage: multer.memoryStorage() })

router.post(
    '/',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'images', maxCount: 10 },
    ]),

    async (req, res) => {
        try {
            if (!req.files.images) {
                res.json({ message: 'Images not found' })
                return
            }

            let product = new Product()

            const downloadUrls = await Promise.all(
                req.files.images.map(async (file) => {
                    const storageRef = ref(
                        storage,
                        `uploads/${product.id}/${file.originalname}`
                    )
                    await uploadBytes(storageRef, file.buffer)
                    const downloadURL = await getDownloadURL(storageRef)
                    return downloadURL
                })
            )

            product.name = req.body.name
            product.description = req.body.description
            product.richDescription = req.body.richDescription
            product.image = downloadUrls[0]
            product.images = downloadUrls
            product.brand = req.body.brand
            product.price = req.body.price
            product.category = req.body.category
            product.countInStock = req.body.countInStock
            product.rating = req.body.rating
            product.numReviews = req.body.numReviews
            product.isFeatured = req.body.isFeatured

            product = await product.save()
            if (!product) return res(500).send('cannot create product.')

            res.send({ success: true, product })
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error', log: err })
        }
    }
)

router.get(`/`, async (req, res) => {
    // http://localhost:3000/api/v1/products?categories=2312,41241 //<- query

    let filter = {}
    if (req.query.categories)
        filter = { category: req.query.categories.split(',') }

    const productList = await Product.find(filter).populate('category') //.select('name image -_id')
    if (!productList) res.status(500).json({ success: false })
    // res.send(productList)
    res.send(productList)
})

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category')
    if (!product)
        res.status(500).json({ success: false, message: 'product not found.' })
    res.send(product)
})

router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then((product) => {
            if (product) {
                // Create a reference to the file to delete
                product.images.forEach(async (file) => {
                    const storage = getStorage()

                    const httpsReference = ref(storage, file)
                    const fileName = httpsReference.name
                    const storageRef = ref(
                        storage,
                        `uploads/${product.id}/${fileName}`
                    )

                    console.log(
                        ` deleting: 'uploads/${product.id}/${fileName}'`
                    )

                    // Delete the file
                    await deleteObject(storageRef)
                        .then(() => {
                            // File deleted successfully
                            console.log(
                                `deleted '${fileName}' image for id: ` +
                                    product.id
                            )
                        })
                        .catch((error) => {
                            // Uh-oh, an error occurred!
                            console.log('error deleting: ' + error)
                        })
                })

                return res.status(200).json({
                    success: true,
                    message: `${product.name} was deleted successfully.`,
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: `product not found.`,
                })
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err })
        })
})

// router.put(`/:id`, async (req, res) => {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//         res.status(400).send('invalid product id')
//     }
//     const category = await Category.findById(req.body.category)
//     if (!category) return res.status(400).send('invalid category')

//     const product = await Product.findByIdAndUpdate(
//         req.params.id,
//         {
//             name: req.body.name,
//             description: req.body.description,
//             richDescription: req.body.richDescription,
//             image: req.body.image,
//             brand: req.body.brand,
//             price: req.body.price,
//             category: req.body.category,
//             countInStock: req.body.countInStock,
//             rating: req.body.rating,
//             numReviews: req.body.numReviews,
//             isFeatured: req.body.isFeatured,
//         },
//         { new: true }
//     )
//     if (!product) return res.status(500).send('product cannot be updated!')
//     res.send(product)
// })

router.put(`/:id`, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('invalid product id')
    }

    const category = await Category.findById(req.body.category)
    if (!category) return res.status(400).send('invalid category')

    const updatedProduct = {
        richDescription: req.body.richDescription || '', // Update richDescription if provided
        image: req.body.image || '', // Update image if provided
        images: req.body.images || [], // Update images if provided
        brand: req.body.brand || '', // Update brand if provided
        price: req.body.price || 0, // Update price if provided
        rating: req.body.rating || 0, // Update rating if provided
        numReviews: req.body.numReviews || 0, // Update numReviews if provided
        isFeatured: req.body.isFeatured || false, // Update isFeatured if provided
        name: req.body.name || '', // Update name if provided
        description: req.body.description || '', // Update description if provided
        category: req.body.category || '', // Update category if provided
        countInStock: req.body.countInStock || 0, // Update countInStock if provided
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        updatedProduct,
        { new: true }
    )

    if (!product) return res.status(500).send('product cannot be updated!')
    res.send(product)
})

router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments()
    if (!productCount) res.status(500).json({ success: false })
    res.send({ productCount: productCount })
})

router.get(`/get/featured/`, async (req, res) => {
    const products = await Product.find({ isFeatured: true })
    if (!products) res.status(500).json({ success: false })
    res.send(products)
})

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({ isFeatured: true }).limit(
        parseInt(count)
    )
    if (!products) res.status(500).json({ success: false })
    res.send(products)
})

module.exports = router
