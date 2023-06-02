const mongoose = require('mongoose')

const domainDataSchema = mongoose.Schema({
    url: {
        type: String,
        trim: true,
    },
    domain: {
        type: String,
        trim: true,
    },
    updated_date: {
        type: String,
        trim: true,
    },
    creation_date: {
        type: String,
        trim: true,
    },
    expiration_date: {
        type: String,
        trim: true,
    },
    registrar: {
        type: String,
        trim: true,
    },
    name: {
        type: String,
        trim: true,
    },
    reg_country: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

//* collection or model
const DomainDatas = new mongoose.model('DomainDatas', domainDataSchema)

module.exports = DomainDatas