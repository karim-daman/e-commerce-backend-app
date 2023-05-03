const { Category } = require('../models/category')
const { Product } = require('../models/product')
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
// const multer = require('multer')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const isValid = FILE_TYPE_MAP[file.mimetype]
//         let uploadError = new Error('invalid image type')

//         if (isValid) uploadError = null
//         cb(uploadError, 'public/uploads')
//     },
//     filename: function (req, file, cb) {
//         const fileName = file.originalname.split(' ').join('_')
//         const extension = FILE_TYPE_MAP[file.mimetype]
//         // cb(null, `${fileName}_${Date.now()}.${extension}`)
//         cb(null, `${Date.now()}_${fileName}`)
//     },
// })

// const uploadOptions = multer({ storage: storage })

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

router.put(`/:id`, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send('invalid product id')
    }
    const category = await Category.findById(req.body.category)
    if (!category) return res.status(400).send('invalid category')

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true }
    )
    if (!product) return res.status(500).send('product cannot be updated!')
    res.send(product)
})

// router.post(`/`, uploadOptions.single('image'), async (req, res) => {
//     const category = await Category.findById(req.body.category)
//     if (!category) return res.status(400).send('invalid category')
//     if (!req.file) return res.status(400).send('No image in the request')
//     const imagePath = `${req.protocol}://${req.get(
//         'host'
//     )}/${req.file.path.replace(/\\/g, '/')}`

//     console.log(req.file.path)

//     let product = new Product({
//         name: req.body.name,
//         description: req.body.description,
//         richDescription: req.body.richDescription,
//         image: imagePath,
//         brand: req.body.brand,
//         price: req.body.price,
//         category: req.body.category,
//         countInStock: req.body.countInStock,
//         rating: req.body.rating,
//         numReviews: req.body.numReviews,
//         isFeatured: req.body.isFeatured,
//     })

//     product = await product.save()
//     if (!product) return res(500).send('cannot create product.')
//     res.send(product)
// })

// router.post(
//     `/`,
//     // uploadOptions.fields([
//     //     { name: 'image', maxCount: 1 },
//     //     { name: 'images', maxCount: 10 },
//     // ]),
//     async (req, res) => {
//         // if (!mongoose.isValidObjectId(req.params.id)) {
//         //     res.status(400).send('invalid product id')
//         // }
//         console.log(req.body.category)
//         const category = await Category.findById(req.body.category)
//         if (!category)
//             return res
//                 .status(400)
//                 .send({ message: 'invalid category', body: req.body })

//         if (!req.files.image[0].path) {
//             console.log(req.files.image[0].path)
//             return res.status(400).send('No image in the request')
//         }

//         const files = req.files.images
//         const file = req.files.image[0]
//         let imagePaths = []
//         let imagePath

//         if (files)
//             files.map(async (file) => {
//                 // store something
//                 await s3
//                     .putObject({
//                         Body: JSON.stringify({
//                             key: `${file.path.replace(/\\/g, '/')}`,
//                         }),
//                         Bucket: process.env.Bucket,
//                         Key: `${file.path.replace(/\\/g, '/')}`,
//                     })
//                     .promise()
//                     .then((res) => {
//                         if (res) {
//                             console.log(
//                                 'Successfully uploaded data to ' +
//                                     process.env.Bucket +
//                                     '/' +
//                                     `${file.path.replace(/\\/g, '/')}`
//                             )
//                             imagePaths.push(
//                                 `${req.protocol}://${
//                                     process.env.Bucket
//                                 }/${file.path.replace(/\\/g, '/')}`
//                             )
//                             return res.status(200).json({
//                                 success: true,
//                                 message: `${res}`,
//                             })
//                         } else {
//                             return res.status(404).json({
//                                 success: false,
//                                 message: `failed.`,
//                             })
//                         }
//                     })
//                     .catch((error) => {
//                         console.log(error)
//                     })

//                 // // get it back
//                 // let my_file = await s3.getObject({
//                 //     Bucket: "cyclic-cute-gold-cormorant-suit-eu-west-2",
//                 //     Key: `${file.path.replace(
//                 //         /\\/g,
//                 //         '/'
//                 //     )}`,
//                 // }).promise()

//                 // console.log(JSON.parse(my_file))

//                 // imagePaths.push(
//                 //     `${req.protocol}://${req.get('host')}/${file.path.replace(
//                 //         /\\/g,
//                 //         '/'
//                 //     )}`
//                 // )
//             })

//         // const imagePath = `${req.protocol}://${req.get(
//         //     'host'
//         // )}/${file.path.replace(/\\/g, '/')}`

//         if (file) {
//             await s3
//                 .putObject({
//                     Body: JSON.stringify({
//                         key: `${file.path.replace(/\\/g, '/')}`,
//                     }),
//                     Bucket: process.env.Bucket,
//                     Key: `${file.path.replace(/\\/g, '/')}`,
//                 })
//                 .promise()
//                 .then((res) => {
//                     if (res) {
//                         console.log(
//                             'Successfully uploaded data to ' +
//                                 process.env.Bucket +
//                                 '/' +
//                                 `${file.path.replace(/\\/g, '/')}`
//                         )
//                         imagePath = `${req.protocol}://${
//                             process.env.Bucket
//                         }/${file.path.replace(/\\/g, '/')}`
//                         return res.status(200).json({
//                             success: true,
//                             message: `${res}`,
//                         })
//                     } else {
//                         return res.status(404).json({
//                             success: false,
//                             message: `failed.`,
//                         })
//                     }
//                 })
//                 .catch((error) => {
//                     console.log(error)
//                 })
//         }

//         let product = new Product({
//             name: req.body.name,
//             description: req.body.description,
//             richDescription: req.body.richDescription,
//             image: imagePath,
//             images: imagePaths,
//             brand: req.body.brand,
//             price: req.body.price,
//             category: req.body.category,
//             countInStock: req.body.countInStock,
//             rating: req.body.rating,
//             numReviews: req.body.numReviews,
//             isFeatured: req.body.isFeatured,
//         })

//         product = await product.save()
//         if (!product) return res(500).send('cannot create product.')
//         res.send(product)
//     }
// )

router.post(`/`, async (req, res) => {
    const category = await Category.findById(req.body.category)
    if (!category)
        return res
            .status(400)
            .send({ message: 'invalid category', body: req.body })

    // if (!req.files.image[0]) {
    //     // console.log(req.files.image[0].path)
    //     return res.status(400).send('No image in the request')
    // }
    if (!req.body.image[0]) {
        return res.status(400).send('No image in the request')
    }

    const files = req.body.images
    const file = req.body.image[0]
    let imagePaths = []
    let imagePath

    if (files)
        files.map(async (file) => {
            await s3
                .putObject({
                    Body: JSON.stringify({
                        key: `${file.path.replace(/\\/g, '/')}`,
                    }),
                    Bucket: process.env.Bucket,
                    Key: `${file.path.replace(/\\/g, '/')}`,
                })
                .promise()
                .then((res) => {
                    if (res) {
                        // console.log(
                        //     'Successfully uploaded data to ' +
                        //         process.env.Bucket +
                        //         '/' +
                        //         `${file.path.replace(/\\/g, '/')}`
                        // )
                        imagePaths.push(
                            `${req.protocol}://${
                                process.env.Bucket
                            }/${file.path.replace(/\\/g, '/')}`
                        )
                        return res.status(200).json({
                            success: true,
                            message: `${res}`,
                        })
                    } else {
                        return res.status(404).json({
                            success: false,
                            message: `failed.`,
                        })
                    }
                })
                .catch((error) => {
                    // console.log(error)
                    return res.status(404).json({
                        success: false,
                        message: error,
                    })
                })
        })

    if (file) {
        await s3
            .putObject({
                Body: JSON.stringify({
                    key: `${file.path.replace(/\\/g, '/')}`,
                }),
                Bucket: process.env.Bucket,
                Key: `${file.path.replace(/\\/g, '/')}`,
            })
            .promise()
            .then((res) => {
                if (res) {
                    // console.log(
                    //     'Successfully uploaded data to ' +
                    //         process.env.Bucket +
                    //         '/' +
                    //         `${file.path.replace(/\\/g, '/')}`
                    // )
                    imagePath = `${req.protocol}://${
                        process.env.Bucket
                    }/${file.path.replace(/\\/g, '/')}`
                    return res.status(200).json({
                        success: true,
                        message: `${res}`,
                    })
                } else {
                    return res.status(404).json({
                        success: false,
                        message: `failed.`,
                    })
                }
            })
            .catch((error) => {
                // console.log(error)
                return res.status(404).json({
                    success: false,
                    message: error,
                })
            })
    }

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: imagePath,
        images: imagePaths,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })

    product = await product.save()
    if (!product) return res(500).send('cannot create product.')
    res.send(product)
})

// router.put(
//     `/gallery/:id`,
//     uploadOptions.array('images', 10),
//     async (req, res) => {
//         if (!mongoose.isValidObjectId(req.params.id)) {
//             res.status(400).send('invalid product id')
//         }
//         const files = req.files
//         let imagePaths = []
//         if (files)
//             files.map((file) => {
//                 imagePaths.push(
//                     `${req.protocol}://${req.get('host')}/${file.path.replace(
//                         /\\/g,
//                         '/'
//                     )}`
//                 )
//             })
//         const product = await Product.findByIdAndUpdate(
//             req.params.id,
//             {
//                 images: imagePaths,
//             },
//             { new: true }
//         )
//         if (!product) return res.status(500).send('product cannot be updated!')
//         res.send(product)
//     }
// )

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
