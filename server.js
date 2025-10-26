const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');  // ADD THIS

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.json({ 
    message: 'NotebookLM Clone Backend API is running!',
    endpoints: {
      upload: '/api/documents/upload (POST)',
      query: '/api/documents/{id}/query (POST)',
      getDoc: '/api/documents/{id} (GET)',
      pdf: '/uploads/{filename} (GET)'
    },
    status: 'OK'
  });
});

app.use(cors({
  origin: [
    'https://notebookllm-git-main-subhammaxs-projects.vercel.app',  // Your Vercel URL
    'http://localhost:5173',  // Local development
    'http://localhost:3000' ,
    "https://notebookllm-lime.vercel.app"  // Backup local
  ],
  credentials: true,
  optionsSuccessStatus: 200  // For older browsers
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// SERVE UPLOADED PDFS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/documents', require('./routes/document'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});