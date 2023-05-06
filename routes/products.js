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

            res.send(JSON.stringify({ product }, null, 2))
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Server error', log: err })
        }
    }
)

// Upload file and metadata to the object 'images/mountains.jpg'

// let s3 = new S3Client({
//     region: process.env.AWS_REGION,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//         sessionToken: process.env.AWS_SESSION_TOKEN,
//     },

//     sslEnabled: false,
//     s3ForcePathStyle: true,
//     signatureVersion: 'v4',
// })

// const FILE_TYPE_MAP = {
//     'image/png': 'png',
//     'image/jpeg': 'jpeg',
//     'image/jpg': 'jpg',
// }

// // function to sanitize files and send error for unsupported files
// function sanitizeFile(file, cb) {
//     // Define the allowed extension
//     const fileExts = ['.png', '.jpg', '.jpeg', '.gif']

//     // Check allowed extensions
//     const isAllowedExt = fileExts.includes(
//         path.extname(file.originalname.toLowerCase())
//     )

//     // Mime type must be an image
//     const isAllowedMimeType = file.mimetype.startsWith('image/')

//     if (isAllowedExt && isAllowedMimeType) {
//         return cb(null, true) // no errors
//     } else {

//         // pass error msg to callback, which can be displaye in frontend
//         cb('Error: File type not allowed!')
//     }
// }

// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         ACL: 'public-read',
//         bucket: process.env.Bucket,
//         metadata: (req, file, callBack) => {
//             callBack(null, { fieldName: file.fieldname })
//         },
//         key: (req, file, callBack) => {
//             var fullPath = 'uploads/' + file.originalname //If you want to save into a folder concat de name of the folder to the path
//             callBack(null, fullPath)
//         },
//     }),
//     // fileFilter: (req, file, callback) => {
//     //     sanitizeFile(file, callback)
//     // },
//     limits: {
//         fileSize: 1024 * 1024 * 2, // 2mb file size
//     },
// }).fields([
//     { name: 'image', maxCount: 1 },
//     { name: 'images', maxCount: 10 },
// ])

// router.post('/', upload, function (req, res, next) {
//     res.send({
//         message: 'Successfully uploaded files!',
//         log: req.files,
//     })

//     let product = new Product({
//         name: req.body.name,
//         description: req.body.description,
//         richDescription: req.body.richDescription,
//         image: imagePath,
//         images: imagePaths,
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

// router.post(`/`, upload, async (req, res) => {
//     const category = await Category.findById(req.body.category)
//     if (!category)
//         return res
//             .status(400)
//             .send({ message: 'invalid category', body: req.body })

//     if (!req.files.images[0]) {
//         console.log(req.files.image[0])
//         return res.status(400).send({
//             message: 'No image in the request',
//             log: req.files,
//         })
//     }

//     const files = req.files.images
//     const file = req.files.image[0]
//     let imagePaths = []
//     let imagePath

//     if (files)
//         files.map(async (file) => {
//             await upload()
//                 .promise()
//                 .then((res) => {
//                     if (res) {
//                         console.log(
//                             'Successfully uploaded data to ' +
//                                 process.env.Bucket +
//                                 '/' +
//                                 `${file.location.replace(/\\/g, '/')}`
//                         )
//                         imagePaths.push(
//                             `${req.protocol}://${
//                                 process.env.Bucket
//                             }/${file.location.replace(/\\/g, '/')}`
//                         )
//                         res.status(200).send({
//                             success: true,
//                             message: `${res}`,
//                         })
//                     } else {
//                         return res.status(404).send({
//                             success: false,
//                             message: `failed.`,
//                         })
//                     }
//                 })
//                 .catch((error) => {
//                     console.log(error)
//                 })
//         })

//     if (file) {
//         upload()
//             .promise()
//             .then((res) => {
//                 if (res) {
//                     console.log(
//                         'Successfully uploaded data to ' +
//                             process.env.Bucket +
//                             '/' +
//                             `${file.path.replace(/\\/g, '/')}`
//                     )
//                     imagePath = `${req.protocol}://${
//                         process.env.Bucket
//                     }/${file.path.replace(/\\/g, '/')}`
//                     res.status(200).send({
//                         success: true,
//                         message: `${res}`,
//                     })
//                 } else {
//                     return res.status(404).send({
//                         success: false,
//                         message: `failed.`,
//                     })
//                 }
//             })
//             .catch((error) => {
//                 console.log(error)
//             })
//     }

//     let product = new Product({
//         name: req.body.name,
//         description: req.body.description,
//         richDescription: req.body.richDescription,
//         image: imagePath,
//         images: imagePaths,
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

// router.post(`/`, async (req, res) => {
//     console.log(req)

//     return res.send({
//         response: req.body,
//     })

//     const category = await Category.findById(req.body.category)
//     if (!category)
//         return res
//             .status(400)
//             .send({ message: 'invalid category', body: req.body })

//     // return res.send(JSON.stringify(req.body, null, 2))

//     // if (!req.files.image[0]) {
//     //     // console.log(req.files.image[0].path)
//     //     return res.status(400).send('No image in the request')
//     // }

//     if (!req.body.images) {
//         return res.status(400).send({
//             message: 'No image in the request',
//             log: req,
//         })
//     }

//     const files = req.body.images
//     const file = req.body.image[0]
//     let imagePaths = []
//     let imagePath

//     return res.send(JSON.stringify(req.body, null, 2))

//     if (files)
//         files.map(async (file) => {
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
//                     // console.log(
//                     //     'Successfully uploaded data to ' +
//                     //         process.env.Bucket +
//                     //         '/' +
//                     //         `${file.path.replace(/\\/g, '/')}`
//                     // )

//                     imagePaths.push(
//                         `${req.protocol}://${
//                             process.env.Bucket
//                         }/${file.path.replace(/\\/g, '/')}`
//                     )
//                     // res.send({
//                     //     success: true,
//                     //     message: '-2:' + `${res}`,
//                     //     result: imagePath,
//                     // })
//                 })
//                 .catch((error) => {
//                     // console.log(error)
//                     return res.status(404).json({
//                         success: false,
//                         message: '0:' + error,
//                     })
//                 })
//         })

//     if (file) {
//         await s3
//             .putObject({
//                 Body: JSON.stringify({
//                     key: `${file.path.replace(/\\/g, '/')}`,
//                 }),
//                 Bucket: process.env.Bucket,
//                 Key: `${file.path.replace(/\\/g, '/')}`,
//             })
//             .promise()
//             .then((res) => {
//                 // console.log(
//                 //     'Successfully uploaded data to ' +
//                 //         process.env.Bucket +
//                 //         '/' +
//                 //         `${file.path.replace(/\\/g, '/')}`
//                 // )
//                 imagePath = `${req.protocol}://${
//                     process.env.Bucket
//                 }/${file.path.replace(/\\/g, '/')}`

//                 // res.send({
//                 //     success: true,
//                 //     message: '1:' + `${res}`,
//                 //     result: imagePath,
//                 // })
//             })
//             .catch((error) => {
//                 // console.log(error)
//                 return res.status(404).json({
//                     success: false,
//                     message: '3:' + error,
//                 })
//             })
//     }

//     let product = new Product({
//         name: req.body.name,
//         description: req.body.description,
//         richDescription: req.body.richDescription,
//         image: imagePath,
//         images: imagePaths,
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
