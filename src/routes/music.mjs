import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { checkAdmin, ensureAuthenticated } from '../authMiddleware.mjs';
import { Music } from '../models/music.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer to save files to the correct 'public/audio' directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/audio'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Base route for /music
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const musicList = await Music.find({ type: 'music' });
    res.render('music.ejs', { musicList }); // Ensure you have a music.ejs view
  } catch (error) {
    console.error('Error fetching music list:', error);
    res.status(500).send('Server error');
  }
});

// GET route to render the upload form
router.get('/upload', checkAdmin, (req, res) => {
  res.render('upload.ejs');
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
    
    console.log('Uploaded file:', req.file);
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

// Route to rename a track or ambient sound
router.post('/rename/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;
  try {
    const music = await Music.findById(id);
    if (!music) return res.status(404).json({ success: false, message: 'Item not found.' });

    music.filename = newName;
    await music.save();
    res.json({ success: true, message: 'Item renamed successfully!' });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ success: false, message: 'Failed to rename item.' });
  }
});

// Route to delete a track or ambient sound
router.delete('/delete/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const music = await Music.findByIdAndDelete(id);
    if (!music) return res.status(404).json({ success: false, message: 'Item not found.' });

    fs.unlinkSync(path.join(__dirname, '../../public/audio', music.filename));
    res.json({ success: true, message: 'Item deleted successfully!' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item.' });
  }
});

export default router;