const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.options('*', cors()) // app.options(process.env.FrontEndURL, cors()) // to be enabled in future

//middleware
app.use(bodyParser.json())
app.use(morgan('tiny'))

// routes
const categoriesRoutes = require('./routes/categories')
const productsRoutes = require('./routes/products')
const usersRoutes = require('./routes/users')
const cartsRoutes = require('./routes/carts')

// routers
const api = process.env.API_URL

app.use(`${api}/categories`, categoriesRoutes)
app.use(`${api}/products`, productsRoutes)
app.use(`${api}/users`, usersRoutes)
app.use(`${api}/carts`, cartsRoutes)

// mongoose
//     .connect(process.env.DB_ConnectionString)
//     .then(console.log('db connected'))
//     .catch((error) => {
//         console.log(error)
//     })

// app.listen(3000, () => {
//     console.log('server running on http://localhost:3000' + process.env.API_URL)
// })

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
    app.listen(PORT, () => {
        console.log('listening for requests')
    })
})
