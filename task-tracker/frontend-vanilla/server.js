const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes by serving index.html (SPA behavior)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Task Tracker Frontend running on http://localhost:${PORT}`);
    console.log(`📱 Backend API running on http://localhost:8000`);
});
