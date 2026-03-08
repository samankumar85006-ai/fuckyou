const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all handler for SPA-like routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📱 Telegram data will be received automatically`);
    console.log(`💡 Health: http://localhost:${PORT}/health`);
});

// Prevent server from going to sleep by pinging it every 5 minutes
setInterval(() => {
    http.get(`http://localhost:${PORT}/health`, (res) => {
        console.log('Server pinged to keep it alive');
    }).on('error', (err) => {
        console.error('Error while pinging server:', err);
    });
}, 5 * 60 * 1000);  // Ping every 5 minutes (5 * 60 * 1000 milliseconds)
