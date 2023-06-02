const mongoose = require('mongoose')

mongoose.connect(`mongodb+srv://vishal:123@cluster0.sula7wu.mongodb.net/`)
.then(() => console.log('connect mongo'))
.catch((err) => console.log(`error ${err}`))

module.exports = mongoose