// server.js
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
require('dotenv').config(); // Load environment variables from .env file

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create Verify service
async function createVerifyService() {
    try {
        const service = await client.verify.v2.services.create({
            friendlyName: 'My First Verify Service',
        });
        console.log(`Verify service created with SID: ${service.sid}`);
        return service.sid;
    } catch (error) {
        console.error('Error creating Verify service:', error);
        throw error;
    }
}

// Endpoint to send verification code
app.post('/send-code', async (req, res) => {
    const toPhoneNumber = req.body.to;

    try {
        const verificationServiceSid = await createVerifyService();

        const verification = await client.verify.v2.services(verificationServiceSid)
            .verifications
            .create({ to: toPhoneNumber, channel: 'sms' });

        res.status(200).send({ message: 'Verification code sent!', verificationSid: verification.sid });
    } catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).send({ error: 'Failed to send verification code' });
    }
});

// Endpoint to verify the code
app.post('/verify-code', async (req, res) => {
    const toPhoneNumber = req.body.to;
    const code = req.body.code;

    try {
        const verificationServiceSid = await createVerifyService();

        const verificationCheck = await client.verify.v2.services(verificationServiceSid)
            .verificationChecks
            .create({ to: toPhoneNumber, code: code });

        if (verificationCheck.status === 'approved') {
            res.status(200).send({ message: 'Verification successful!' });
        } else {
            res.status(400).send({ message: 'Verification failed. Please try again.' });
        }
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).send({ error: 'Failed to verify code' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});