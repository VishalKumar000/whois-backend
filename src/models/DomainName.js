const mongoose = require('mongoose')

const domainNameSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

//* collection or model
const DomainName = new mongoose.model('DomainNames', domainNameSchema)

module.exports = DomainName