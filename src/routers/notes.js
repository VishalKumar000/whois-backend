const express = require('express');
const tldjs = require('tldjs');
const cors = require('cors');
const whois = require('whois');
const DomainName = require('../models/DomainName');
const DomainData = require('../models/DomainData');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const os = require('os')
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { CronJob } = require('cron');

const router = express.Router();
router.use(cors());

const DOMAIN_REGEX = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

router.post('/', async (req, res) => {
    const DOMAIN = req.body.domain.match(DOMAIN_REGEX)[0];
    const parsedDomain = tldjs.parse(DOMAIN);

    if (!parsedDomain.isValid) {
        return res.redirect('/');
    }

    const urlLink = `${req.protocol}://${parsedDomain.hostname || 'www.' + parsedDomain.domain}`;
    let jsonResult;

    whois.lookup(parsedDomain.domain, async (err, data) => {
        if (err) {
            return res.status(500).send('An error occurred during WHOIS lookup.');
        }

        const whoisData = data.replace(/\r\n/g, '\n');
        const lines = whoisData.split('\n');

        jsonResult = {
            url: urlLink,
            domain: parsedDomain.domain,
        };

        lines.forEach((line) => {
            const [key, value] = line.split(': ');

            switch (key) {
                case 'Updated Date':
                    jsonResult.updated_date = value;
                    break;
                case 'Creation Date':
                    jsonResult.creation_date = value;
                    break;
                case 'Registrar Registration Expiration Date':
                    jsonResult.expiration_date = value;
                    break;
                case 'Registrar':
                    jsonResult.registrar = value;
                    break;
                case 'Registrant Name':
                    jsonResult.name = value;
                    break;
                case 'Registrant Email':
                    const regex = /https:\/\/.*/;
                    const match = value.match(regex);
                    jsonResult.email = match ? match[0] : null;
                    break;
                case 'Registrant Phone':
                    jsonResult.phone = value;
                    break;
                case 'Registrant Country':
                    jsonResult.reg_country = value;
                    break;
            }
        });

        //* Send the JSON result as a response
        res.json(jsonResult);

        //! Check if the domain already exists in DomainName collection
        let searchData = await DomainName.findOne({ title: req.body.domain }).exec();
        if (searchData) {
            //! Update the existing domain data in DomainData collection
            const domainData = await DomainData.findByIdAndUpdate(
                searchData.domainData,
                { $set: jsonResult },
                { new: true }
            );
            if (domainData) {
                await domainData.save();
            } else {
                console.error("Failed to update domain data b/c same data already exits");
            }
            return;
        }

        //! Adding a new domain in DomainName (unique)
        const domainData = new DomainData(jsonResult);
        await domainData.save();

        const domainName = new DomainName({ title: req.body.domain, domainData: domainData._id });
        await domainName.save();
    });
});

router.get('/', async (req, res) => {
    const domainName = await DomainName.find({});
    res.json(domainName)
});

router.get('/domainDataAll', async (req, res) => {
    const domainData = await DomainData.find({});
    res.json(domainData)
});

router.get('/export-csv', async (req, res) => {
    const csvWriter = createCsvWriter({
        path: path.join(os.tmpdir(), 'domain_data.csv'),
        header: [
            { id: 'url', title: 'URL' },
            { id: 'domain', title: 'Domain' },
            { id: 'updated_date', title: 'Updated Date' },
            { id: 'creation_date', title: 'Creation Date' },
            { id: 'expiration_date', title: 'Expiration Date' },
            { id: 'registrar', title: 'Registrar' },
            { id: 'name', title: 'Name' },
            { id: 'email', title: 'Email' },
            { id: 'phone', title: 'Phone' },
            { id: 'reg_country', title: 'Registration Country' },
        ],
    });

    try {
        const domainData = await DomainData.find().exec();
        const records = domainData.map((data) => ({
            url: data.url,
            domain: data.domain,
            updated_date: data.updated_date,
            creation_date: data.creation_date,
            expiration_date: data.expiration_date,
            registrar: data.registrar,
            name: data.name,
            email: data.email,
            phone: data.phone,
            reg_country: data.reg_country,
        }));

        await csvWriter.writeRecords(records);
        const csvFilePath = path.join(os.tmpdir(), 'domain_data.csv');

        res.download(csvFilePath, 'domain_data.csv', (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('An error occurred while exporting the CSV file.');
            }

            fs.unlinkSync(csvFilePath);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while exporting the CSV file.');
    }
});

const cronJob = new CronJob('*/15 * * * * *', async () => {
// const cronJob = new CronJob('0 0 * * *', async () => {
    const domainNames = await DomainName.find({});
    let data = ''

    for (const domainName of domainNames) {
        data += `Domain: ${domainName.title}\n`;
        const res = await DomainData.find({domain : domainName.title});
        if (res) {
            data += `Updated Date: ${res.updated_date}\n`;
            data += `Creation Date: ${res.creation_date}\n`;
            data += `Expiration Date: ${res.expiration_date}\n`;
            data += `Registrar: ${res.registrar}\n`;
            data += `Registration Country: ${res.reg_country}\n`;
            data += `Email: ${res.email}\n`;
            data += `Date: ${new Date().toISOString()}\n\n`;
        }
    }

    const mailSender = async (sender, reciever) => {
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'ahmed4@ethereal.email',
                pass: 'aXSKTGVQ6NzKQJXMhc'
            }
        });

        let info = await transporter.sendMail({
            from: sender,
            to: reciever,
            subject: "Extracted Data",
            text: data,
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    mailSender('yadav11adu@gmail.com', "viskumarbit001@gmail.com")
});

cronJob.start();

module.exports = router;
