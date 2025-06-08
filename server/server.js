require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { createNotionNote, validateNotionCredentials } = require('./notion');
const { queueEmail, queueTask } = require('./taskQueue');
const axios = require('axios'); // Ensure axios is imported for OAuth
const { Client } = require('@notionhq/client'); // Ensure Notion Client is imported

const app = express();
const port = 3001;

// Notion OAuth configuration
const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/notion-callback';

// Enable CORS
app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies

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
const createTranscriptionScript = () => {
  return `
import whisper
import sys
import json

# Load model only once at startup
print("Loading Whisper model...", file=sys.stderr)
model = whisper.load_model("base")
print("Whisper model loaded successfully", file=sys.stderr)

# Continuous operation
while True:
    try:
        # Read audio path from stdin
        audio_path = input().strip()
        if not audio_path:
            continue
            
        # Transcribe the audio
        result = model.transcribe(audio_path)
        # Send result as JSON
        print(json.dumps({"text": result["text"]}))
        sys.stdout.flush()
    except Exception as e:
        # Send error as JSON
        print(json.dumps({"error": str(e)}))
        sys.stdout.flush()
`;
};

// Store the Python process
let pythonProcess = null;
let isProcessing = false;
let processingQueue = [];

// Start the Python process
function startPythonProcess() {
  if (pythonProcess) {
    console.log('Python process already running');
    return;
  }

  console.log('Starting Python process...');
  pythonProcess = spawn('python', ['-c', createTranscriptionScript()]);
  
  pythonProcess.stderr.on('data', (data) => {
    // Log all stderr output for debugging
    console.log(`Python Process: ${data}`);
  });

  pythonProcess.stdout.on('data', (data) => {
    try {
      const result = JSON.parse(data.toString());
      if (result.error) {
        console.error('Transcription error:', result.error);
        if (processingQueue.length > 0) {
          const { reject } = processingQueue.shift();
          reject(new Error(result.error));
        }
      } else {
        if (processingQueue.length > 0) {
          const { resolve } = processingQueue.shift();
          resolve(result.text);
        }
      }
      isProcessing = false;
      processNextInQueue();
    } catch (error) {
      console.error('Error parsing Python output:', error);
    }
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    pythonProcess = null;
    isProcessing = false;
    // Restart the process if it exits
    setTimeout(startPythonProcess, 1000);
  });

  pythonProcess.on('error', (error) => {
    console.error('Python process error:', error);
    pythonProcess = null;
    isProcessing = false;
    // Restart the process if there's an error
    setTimeout(startPythonProcess, 1000);
  });
}

// Process next item in queue
function processNextInQueue() {
  if (isProcessing || processingQueue.length === 0 || !pythonProcess) {
    return;
  }

  isProcessing = true;
  const { audioPath } = processingQueue[0];
  // Replace backslashes with forward slashes for Python path compatibility
  const safeAudioPath = audioPath.replace(/\\/g, '/');
  pythonProcess.stdin.write(safeAudioPath + '\n');
}

// Function to handle transcription
async function handleTranscription(audioPath) {
  return new Promise((resolve, reject) => {
    processingQueue.push({ audioPath, resolve, reject });
    processNextInQueue();
  });
}

// Start the Python process when the server starts
startPythonProcess();

// Original transcription endpoint
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const audioPath = req.file.path;
  console.log('Queueing task for:', email);

  try {
    // Queue the task and return immediately
    queueTask(audioPath, email);
    
    // Send immediate response
    res.json({ 
      message: 'Your audio has been queued for processing. You will receive an email when it\'s ready.',
      status: 'queued'
    });
  } catch (error) {
    console.error('Error queueing task:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint for transcription with Notion integration
app.post('/transcribe-to-notion', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  // Get user's Notion configuration from request
  let userConfig;
  try {
    userConfig = JSON.parse(req.body.userConfig);
    console.log('Parsed Notion config:', {
      hasAccessToken: !!userConfig.accessToken,
      hasDatabaseId: !!userConfig.databaseId,
      hasNoteTitle: !!userConfig.noteTitle,
      databaseId: userConfig.databaseId,
      noteTitle: userConfig.noteTitle
    });
  } catch (error) {
    console.error('Error parsing userConfig:', error);
    return res.status(400).json({ error: 'Invalid Notion configuration' });
  }

  if (!userConfig || !userConfig.accessToken || !userConfig.databaseId) {
    console.error('Missing required Notion config:', {
      hasAccessToken: !!userConfig?.accessToken,
      hasDatabaseId: !!userConfig?.databaseId
    });
    return res.status(400).json({ error: 'Notion access token and database ID are required' });
  }

  const audioPath = req.file.path;
  console.log('Processing audio file for Notion:', audioPath);

  try {
    const transcription = await handleTranscription(audioPath);
    console.log('Transcription completed, length:', transcription.length);
    
    // Clean up the uploaded file
    fs.unlink(audioPath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    // Create Notion note with user's configuration
    console.log('Attempting to create Notion note with config:', {
      hasApiKey: !!userConfig.accessToken,
      databaseId: userConfig.databaseId,
      noteTitle: userConfig.noteTitle
    });

    const notionResult = await createNotionNote(transcription.trim(), {
      notionApiKey: userConfig.accessToken,
      notionDatabaseId: userConfig.databaseId,
      noteTitle: userConfig.noteTitle
    });

    console.log('Notion note creation result:', notionResult);

    if (notionResult.success) {
      res.json({
        text: transcription.trim(),
        notion: {
          success: true,
          pageId: notionResult.pageId,
          url: notionResult.url
        }
      });
    } else {
      console.error('Notion note creation failed:', notionResult.error);
      res.json({
        text: transcription.trim(),
        notion: {
          success: false,
          error: notionResult.error
        }
      });
    }
  } catch (error) {
    console.error('Error in transcribe-to-notion:', error);
    // Clean up the uploaded file
    fs.unlink(audioPath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.status(500).json({ error: error.message });
  }
});

// New endpoint to validate Notion credentials (using OAuth token as validation)
app.post('/validate-notion', async (req, res) => {
  const { accessToken, databaseId } = req.body;
  
  if (!accessToken || !databaseId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Notion access token and database ID are required' 
    });
  }

  // For OAuth, validation is usually implied by successful token exchange and ability to list databases.
  // A direct validation call here might not be necessary if the token exchange ensures validity,
  // but keeping it for now if needed for frontend logic.
  try {
    const notion = new Client({
      auth: accessToken,
    });
    // Try to access the database
    await notion.databases.retrieve({
      database_id: databaseId,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Notion OAuth endpoints - Re-adding these for the frontend to connect
app.post('/notion-auth', (req, res) => {
  console.log('Received POST request to /notion-auth');
  if (!NOTION_CLIENT_ID || !REDIRECT_URI) {
    console.error('Missing NOTION_CLIENT_ID or REDIRECT_URI environment variable.');
    return res.status(500).json({ error: 'Server configuration error: Missing Notion Client ID or Redirect URI.' });
  }
  
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${REDIRECT_URI}`;
  res.json({ url: authUrl });
});

app.get('/notion-callback', async (req, res) => {
  const code = req.query.code; 
  console.log('Received callback with code:', code);
  
  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    console.log('Attempting to exchange code for token...');
    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Notion Token Exchange Response Data:', response.data);
    const { access_token, workspace_id, workspace_name, workspace_icon, bot_id } = response.data;

    const notion = new Client({
      auth: access_token,
    });

    console.log('Attempting to search for databases...');
    const databases = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      }
    });
    
    console.log('Notion Database Search Results (count):', databases.results.length);
    console.log('Notion Database Search Results (data):', databases.results);

    const resultData = {
      success: true,
      access_token,
      workspace: {
        id: workspace_id,
        name: workspace_name,
        icon: workspace_icon
      },
      databases: databases.results
    };
    
    console.log('Sending resultData to frontend:', resultData);
    res.send(`
      <script>
        window.opener.postMessage({
          type: 'notion-oauth-callback',
          payload: ${JSON.stringify(resultData)}
        }, '*');
        window.close();
      </script>
    `);

  } catch (error) {
    console.error('Error in Notion callback:', error.response?.data || error.message);
    res.status(500).send(`
      <script>
        window.opener.postMessage({
          type: 'notion-oauth-callback',
          payload: {
            success: false,
            error: ${JSON.stringify(error.response?.data?.error_description || error.message)}
          }
        }, '*');
        window.close();
      </script>
    `);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 