require('dotenv').config()
require('./db/connect')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const cors = require('cors');
const app = express()

//* static files
const staticPath = path.join(__dirname, '../public')
app.use(express.static(staticPath))

//* tempate engine using REACT JS

//* middleware
app.use(express.json())
app.use(cors());
app.use(cookieParser())
app.use(express.urlencoded({ extended : true }))
app.use('/', require('./routers/notes'));

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`http://127.0.0.1:${port}`))