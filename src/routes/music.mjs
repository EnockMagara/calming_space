import express from 'express';
import { MongoClient, GridFSBucket } from 'mongodb';
import multer from 'multer';
import dotenv from 'dotenv';
import { checkAdmin } from '../authMiddleware.mjs';
import { Readable } from 'stream';

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Connect to MongoDB
const client = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect().then(() => {
  console.log('Connected to MongoDB successfully');
  const db = client.db(); // Use the default database
  const bucket = new GridFSBucket(db, { bucketName: 'musics' });

  // Render upload page
  router.get('/upload', checkAdmin, (req, res) => {
    res.render('upload.ejs');
  });

  // Handle file upload
  router.post('/upload', checkAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
      console.log('No file uploaded.');
      return res.status(400).send('No file uploaded.');
    }

    console.log('File received:', req.file);

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const uploadStream = bucket.openUploadStream(req.file.originalname);
    readableStream.pipe(uploadStream)
      .on('error', (error) => {
        console.error('Upload error:', error);
        res.status(500).send('Failed to upload music.');
      })
      .on('finish', () => {
        console.log('File uploaded successfully:', req.file.originalname);
        res.status(201).send('Music uploaded successfully!');
      });
  });

  // Stream music
  router.get('/stream/:filename', (req, res) => {
    const { filename } = req.params;
    console.log(`Received request to stream file: ${filename}`);

    const bucket = new GridFSBucket(client.db(), { bucketName: 'musics' });
    console.log('GridFSBucket initialized');

    // Decode the filename if necessary
    const decodedFilename = decodeURIComponent(filename);
    console.log(`Querying for decoded filename: ${decodedFilename}`);

    // Set a timeout for the query
    const queryOptions = { maxTimeMS: 5000 }; // 5 seconds timeout

    // Find the file in the database
    bucket.find({ filename: decodedFilename }, queryOptions).toArray((err, files) => {
      if (err) {
        console.error('Error during query:', err);
        return res.status(500).send('Error querying database');
      }

      console.log('Query executed successfully');
      console.log('Files found:', files);

      if (files.length === 0) {
        console.log('File not found:', decodedFilename);
        return res.status(404).send('File not found');
      }

      console.log('File found, starting stream:', decodedFilename);

      // Stream the file
      const downloadStream = bucket.openDownloadStreamByName(decodedFilename);
      res.set('Content-Type', 'audio/mpeg');

      downloadStream.on('error', (error) => {
        console.error('Error during streaming:', error);
        res.status(500).send('Error during file streaming');
      });

      downloadStream.on('data', (chunk) => {
        console.log('Streaming chunk size:', chunk.length);
      });

      downloadStream.pipe(res)
        .on('end', () => {
          console.log('Streaming finished for:', decodedFilename);
        });
    });
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

export default router;
