import express from 'express';
import { checkAdmin } from '../authMiddleware.mjs';
import { Music } from '../models/music.mjs';
import { upload } from '../config/gridfs.mjs';

const router = express.Router();

// Render upload page
router.get('/upload', checkAdmin, (req, res) => {
  res.render('upload.ejs');
});

// Handle file upload
router.post('/upload', checkAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('File received:', req.file);
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const { type, description } = req.body;
    const newMusic = new Music({
      filename: req.file.filename,
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

export default router;
