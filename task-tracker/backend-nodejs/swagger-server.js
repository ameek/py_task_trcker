const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files (swagger.yaml and api-docs.html)
app.use(express.static(__dirname));

// Serve the Swagger UI at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-docs.html'));
});

// CORS for API testing
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

app.listen(PORT, () => {
    console.log(`📚 Swagger Documentation Server running at:`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/`);
    console.log(`📄 Raw Swagger YAML: http://localhost:${PORT}/swagger.yaml`);
});
