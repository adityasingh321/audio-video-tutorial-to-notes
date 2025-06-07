const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3001;

// Enable CORS
app.use(cors());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'audio-' + Date.now() + '.webm');
  }
});

const upload = multer({ storage: storage });

// Create a Python script to handle transcription
const createTranscriptionScript = (audioPath) => `
import whisper
import sys

# Load model only once at startup
if 'model' not in globals():
    model = whisper.load_model("base")

${audioPath ? `# Transcribe the audio
result = model.transcribe("${audioPath.replace(/\\/g, '\\\\')}")
print(result["text"])` : ''}
`;

// Store the Python process
let pythonProcess = null;

// Start the Python process
function startPythonProcess() {
  // Initialize Python process without processing any audio
  pythonProcess = spawn('python', ['-c', createTranscriptionScript()]);
  
  pythonProcess.stderr.on('data', (data) => {
    // Only log actual errors, not the FP16 warning
    if (!data.toString().includes('FP16 is not supported on CPU')) {
      console.error(`Python Error: ${data}`);
    }
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`Python process exited with code ${code}`);
      // Restart the process if it exits with an error
      startPythonProcess();
    }
  });
}

// Start the Python process when the server starts
startPythonProcess();

app.post('/transcribe', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const audioPath = req.file.path;
  console.log('Processing audio file:', audioPath);

  // Create a new Python process for this request
  const pythonProcess = spawn('python', ['-c', createTranscriptionScript(audioPath)]);

  let transcription = '';
  let error = '';

  pythonProcess.stdout.on('data', (data) => {
    transcription += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    // Only log actual errors, not the FP16 warning
    if (!data.toString().includes('FP16 is not supported on CPU')) {
      error += data.toString();
      console.error(`Python Error: ${data}`);
    }
  });

  pythonProcess.on('close', (code) => {
    // Clean up the uploaded file
    fs.unlink(audioPath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    if (code !== 0) {
      return res.status(500).json({ error: `Python process exited with code ${code}: ${error}` });
    }

    res.json({ text: transcription.trim() });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 