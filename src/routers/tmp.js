const express = require('express')
const fs = require('fs');
const csv = require('csv-parser');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');

const XRegExp = require('xregexp');
const tldjs = require('tldjs');
const whois = require('whois');
const jsonFromText = require('json-from-text');

const router = new express.Router()
const outputFile = 'data.csv';

const fetchWhoisData = async (domain) => {
    return new Promise((resolve, reject) => {
        whois.lookup(domain, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/*
    fetchWhoisData('google.com')
    .then((data) => {
        console.log(data);
    }).catch((err) => {
        console.log(err);
    })
    mailSender()
*/

function parseWhoisData(data) {
    const lines = data.split('\n');
    const record = {};

    console.log(data);

    for (const line of lines) {
        if (line.startsWith('Registrant Name:')) {
            record.name = line.split(':')[1].trim();
        } else if (line.startsWith('Domain Name:')) {
            record.domain = line.split(':')[1].trim();
        } else if (line.startsWith('Registrant Email:')) {
            record.email = line.split(':')[1].trim();
        } else if (line.startsWith('Registrant Phone:')) {
            record.phone = line.split(':')[1].trim();
        }
    }

    return record;
}


/*

fetchWhoisData('google.com')
.then((data) => {
    console.log(parseWhoisData(data));
}).catch((err) => {
    console.log(err);
})
*/

