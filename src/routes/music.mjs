import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { checkAdmin } from '../authMiddleware.mjs';
import { Music } from '../models/music.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer to save files to the correct 'public/audio' directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/audio')); // Adjusted path
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use original file name
  }
});

const upload = multer({ storage });

// GET route to render the upload form
router.get('/upload', checkAdmin, (req, res) => {
  res.render('upload.ejs'); // Render the upload form
});

// POST route to handle file upload
router.post('/upload', checkAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ success: false, message: 'File upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    
    // Log the uploaded file details
    console.log('Uploaded file:', req.file);

    // Log the path where the file is expected to be saved
    const expectedFilePath = path.join(__dirname, '../../public/audio', req.file.originalname);
    console.log('Expected file path:', expectedFilePath);

    const { type, description } = req.body;
    const newMusic = new Music({
      filename: req.file.originalname,
      type,
      description
    });
    
    await newMusic.save();
    res.status(201).json({ success: true, message: 'Music uploaded successfully!' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload music.' });
  }
});

// Stream music
router.get('/stream/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../public/audio', filename);

  res.set('Content-Type', 'audio/mpeg');
  res.set('Accept-Ranges', 'bytes');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);

  stream.on('error', (error) => {
    console.error('Error streaming file:', error);
    res.status(500).send('Error streaming file');
  });
});

export default router;
