const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Create a Python script to handle transcription
const createTranscriptionScript = (audioPath) => `
import whisper
model = whisper.load_model("base")
result = model.transcribe("${audioPath.replace(/\\/g, '\\\\')}")
print(result["text"])
`;

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No audio file provided');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Received audio file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const audioPath = req.file.path;
    const scriptPath = path.join(__dirname, 'transcribe.py');
    
    // Create the Python script
    fs.writeFileSync(scriptPath, createTranscriptionScript(audioPath));
    console.log('Created transcription script');
    
    // Run the Python script
    console.log('Running transcription...');
    const { stdout, stderr } = await execPromise(`python "${scriptPath}"`);
    
    if (stderr) {
      console.error('Transcription error:', stderr);
    }
    
    console.log('Transcription completed');
    
    // Clean up the temporary files
    fs.unlinkSync(audioPath);
    fs.unlinkSync(scriptPath);
    console.log('Cleaned up temporary files');
    
    res.json({ text: stdout.trim() });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ 
      error: 'Error processing audio',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 