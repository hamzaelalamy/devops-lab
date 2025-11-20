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
const upload = multer({ storage: multer.memoryStorage() });

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

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const file = req.file;

    if (!name || !price || !file) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Upload to S3
    const fileName = `${Date.now()}-${file.originalname}`;
    const s3Command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await s3Client.send(s3Command);

    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    await pool.execute(
      "INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)",
      [name, description, price, imageUrl]
    );
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Error adding product", details: err.message });
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
