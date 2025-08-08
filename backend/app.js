require('dotenv').config(); // load .env

const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));


// Multer untuk handle upload file
const upload = multer({ storage: multer.memoryStorage() });

// Konfigurasi AWS S3 pakai env
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Pool MySQL pakai env
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT id, nama, harga, gambar FROM produk ORDER BY id DESC');

    // Kalau di database kamu gambar disimpan sebagai URL S3 lengkap, tinggal pakai langsung:
    // Kalau cuma nama file, bikin URL lengkap:
    const items = rows.map(item => ({
      id: item.id,
      name: item.nama,
      price: item.harga,
      imageUrl: item.gambar // atau kalau hanya filename: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.gambar}`
    }));

    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});


// Route upload item
app.post('/api/items', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }
    if (!req.body.name || !req.body.price) {
      return res.status(400).json({ error: 'Name dan price harus diisi' });
    }

    const s3Key = Date.now() + path.extname(req.file.originalname);
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const s3Result = await s3.upload(params).promise();

    await pool.promise().query(
      'INSERT INTO produk (nama, harga, gambar) VALUES (?, ?, ?)',
      [req.body.name, req.body.price, s3Result.Location]
    );

    res.json({ message: 'Item berhasil diupload' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error', detail: err.message });
  }
});


// Start server pakai port dari env
app.listen(process.env.PORT, '0.0.0.0',() => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});