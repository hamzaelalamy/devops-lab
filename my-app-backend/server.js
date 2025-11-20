const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Configure local file storage
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
      // Save with timestamp to avoid collisions
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myapp',
  waitForConnections: true,
  connectionLimit: 10,
});

// Create uploads folder if it doesn’t exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

async function createTables() {
  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=INNODB;
  `;
  await pool.query(createProductsTable);
}

app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const file = req.file;
    if (!name || !price || !file) {
      console.error('Missing fields:', { name, price, file });
      return res.status(400).json({ error: 'Missing fields' });
    }
    // Local image path for retrieval
    const localImageUrl = `/uploads/${file.filename}`;
    await pool.execute(
      'INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)',
      [name, description, price, localImageUrl]
    );
    res.json({ success: true, imageUrl: localImageUrl });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error adding product', details: err.message });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products ORDER BY id DESC');
    // Map local URLs to absolute (for frontend usage)
    const backendUrl = `http://localhost:${process.env.PORT || 3000}`;
    rows.forEach(prod => {
      if (prod.image_url && !prod.image_url.startsWith('http'))
        prod.image_url = backendUrl + prod.image_url;
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Health endpoint (optional)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
createTables().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
