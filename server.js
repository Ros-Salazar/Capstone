const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Function to send email
async function sendEmail(recipient) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ceo.management2600@gmail.com', // Replace with your email
            pass: 'ceo@manage123'    // Replace with your Gmail App Password
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: recipient,
        subject: 'Notification from CEO Website',
        text: 'Hello, you have been added as a Key Person on our website.'
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// API endpoint to handle notifications
app.post('/notify', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Email is required.');
    }

    try {
        await sendEmail(email);
        res.status(200).send('Notification sent successfully.');
    } catch (error) {
        res.status(500).send('Failed to send email.');
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
