const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/send-email', async (req, res) => {
    const { email } = req.body;

    if (!email || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email }] }],
                from: { email: 'your-email@example.com' },
                subject: 'Notification from My Website',
                content: [{ type: 'text/plain', value: 'Hello, this is a test email.' }],
            }),
        });

        if (response.ok) {
            res.status(200).json({ message: 'Email sent successfully' });
        } else {
            const error = await response.json();
            res.status(500).json({ error: 'Failed to send email', details: error });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
