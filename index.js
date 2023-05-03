const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const mongoose = require('mongoose')
const cors = require('cors')
const fs = require('@cyclic.sh/s3fs')

require('dotenv').config()

var { expressjwt: jwt } = require('express-jwt')

app.use(cors())
app.options('*', cors()) // app.options(process.env.FrontEndURL, cors()) // to be enabled in future

//middleware
app.use(bodyParser.json())
app.use(morgan('tiny'))
// app.use('/public/uploads', express.static(__dirname + '/public/uploads'))

fs.writeFileSync(
    '/public/uploads',
    express.static(__dirname + '/public/uploads')
)

// routes
const categoriesRoutes = require('./routes/categories')
const productsRoutes = require('./routes/products')
const usersRoutes = require('./routes/users')
const cartsRoutes = require('./routes/carts')

// routers
const api = process.env.API_URI

app.use(
    jwt({
        secret: process.env.Secret,
        algorithms: ['HS256'],
        isRevoked: async (req, token) => {
            if (token.payload.isAdmin === false) return true
            return false
        },
        function(req, res) {
            return res.status(200).send(req)
        },
    }).unless({
        path: [
            { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS'] },
            {
                url: /\/api\/v1\/orders(.*)/,
                methods: ['GET', 'OPTIONS', 'POST'],
            },

            `/`,
            `${api}`,
            `${api}/users/login`,
            `${api}/users/register`,
        ],
    })
)

app.get(api, (req, res) => {
    res.status(200).send('e-commerce-backend-app')
})
app.get('/', (req, res) => {
    res.status(200).send('e-commerce-backend-app')
})
app.use(`${api}/categories`, categoriesRoutes)
app.use(`${api}/products`, productsRoutes)
app.use(`${api}/users`, usersRoutes)
app.use(`${api}/carts`, cartsRoutes)

const PORT = process.env.PORT || 3000

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_ConnectionString)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

//Connect to the database before listening
connectDB().then(() => {
    console.log(
        `server running on http://localhost:${PORT}` + process.env.API_URI
    )
    app.listen(PORT, () => {
        console.log('listening for requests')
    })
})
