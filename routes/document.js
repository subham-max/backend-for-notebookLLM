const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const PDFProcessor = require('../utils/pdfProcessor');
const RAG = require('../utils/rag');

const router = express.Router();

// Store PDFs in 'uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// FIXED UPLOAD ROUTE
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    console.log('Upload started:', req.file?.originalname);
    
    const { originalname } = req.file;
    const docId = uuidv4();

    // STEP 1: Read file from disk (since buffer is undefined with disk storage)
    const fileBuffer = fs.readFileSync(req.file.path);
    console.log('File read:', fileBuffer.length, 'bytes');

    // STEP 2: Extract text from PDF
    const { fullText, pages } = await PDFProcessor.extractText(fileBuffer);
    console.log('Text extracted:', pages.length, 'pages');

    // STEP 3: Save to database
    const document = new Document({
      id: docId,
      filename: originalname,
      filepath: req.file.path,
      text: fullText,
      pages
    });

    await document.save();
    console.log('Document saved to DB');

    res.json({
      success: true,
      documentId: docId,
      filename: originalname,
      filepath: `/uploads/${req.file.filename}`,
      pageCount: pages.length
    });

  } catch (error) {
    console.error('UPLOAD ERROR:', error);
    
    // Clean up uploaded file if error
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack // For debugging
    });
  }
});

// Serve PDF file
router.get('/pdf/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  console.log('Serving PDF:', filePath);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  res.sendFile(filePath);
});

// Get document info
router.get('/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    const document = await Document.findOne({ id: docId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({
      filename: document.filename,
      filepath: `/uploads/${path.basename(document.filepath)}`,
      pageCount: document.pages.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Query document
router.post('/:docId/query', async (req, res) => {
  try {
    const { docId } = req.params;
    const { question } = req.body;

    const document = await Document.findOne({ id: docId });
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const result = await RAG.query(document, question);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;