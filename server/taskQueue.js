const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { queueEmail } = require('./email');
const { generateTranscriptionPdf, generateNotesPdf } = require('./pdfGenerator');
const { generateNotesWithGemini } = require('./gemini');

// Queue to store pending tasks
const taskQueue = [];
let isProcessingQueue = false;

// Create a Python script to handle transcription
const createTranscriptionScript = (audioPath) => {
  // Replace backslashes with forward slashes for Python path compatibility
  const safeAudioPath = audioPath.replace(/\\/g, '/');
  return `
import whisper
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Load model only once per process
if 'model' not in globals():
    print("Loading Whisper model...", file=sys.stderr)
    model = whisper.load_model("base")
    print("Whisper model loaded successfully", file=sys.stderr)

# Transcribe the audio
result = model.transcribe("${safeAudioPath}")
print(result["text"])
`;
};

// Function to handle transcription
async function handleTranscription(audioPath) {
  return new Promise((resolve, reject) => {
    console.log('Starting transcription for:', audioPath);
    const pythonProcess = spawn('python', ['-c', createTranscriptionScript(audioPath)]);
    let transcription = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      transcription += data.toString();
      console.log('Received transcription data:', data.toString().substring(0, 100) + '...');
    });

    pythonProcess.stderr.on('data', (data) => {
      if (!data.toString().includes('FP16 is not supported on CPU')) {
        error += data.toString();
        console.error(`Python Error: ${data}`);
      }
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Transcription failed with code:', code);
        reject(new Error(`Python process exited with code ${code}: ${error}`));
      } else {
        console.log('Transcription completed successfully');
        resolve(transcription.trim());
      }
    });
  });
}

// Function to process a single task
async function processTask(task) {
  const { audioPath, email } = task;
  console.log('Starting to process task for:', email);
  let pdfFilePath = null; // Initialize pdfFilePath
  try {
    console.log('Beginning transcription for:', email);
    const transcription = await handleTranscription(audioPath);
    console.log('Transcription completed. Generating notes with Gemini 1.5 Flash...');

    // Generate notes using Gemini
    const generatedNotes = await generateNotesWithGemini(transcription);
    console.log('Notes generated. Generating PDFs...');

    // Generate transcription PDF
    const transcriptionPdfFileName = `transcription-${Date.now()}.pdf`;
    const transcriptionPdfFilePath = path.join(__dirname, 'uploads', transcriptionPdfFileName);
    await generateTranscriptionPdf(transcription, transcriptionPdfFilePath);
    const transcriptionPdfBuffer = await fs.promises.readFile(transcriptionPdfFilePath);

    // Generate notes PDF
    const notesPdfFileName = `notes-${Date.now()}.pdf`;
    const notesPdfFilePath = path.join(__dirname, 'uploads', notesPdfFileName);
    await generateNotesPdf(generatedNotes, notesPdfFilePath);
    const notesPdfBuffer = await fs.promises.readFile(notesPdfFilePath);

    // Send success email with both PDFs attached
    await queueEmail(
      email,
      'Your Audio Notes are Ready',
      `Your audio transcription and structured notes are attached as PDFs.`,
      [
        {
          filename: transcriptionPdfFileName,
          content: transcriptionPdfBuffer,
          contentType: 'application/pdf'
        },
        {
          filename: notesPdfFileName,
          content: notesPdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    );

    // Clean up the uploaded audio file
    fs.unlink(audioPath, (err) => {
      if (err) {
        console.error('Error deleting audio file:', err);
      } else {
        console.log('Successfully cleaned up audio file:', audioPath);
      }
    });

    // Clean up the generated PDF files immediately after reading into buffer
    [transcriptionPdfFilePath, notesPdfFilePath].forEach((filePath) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting PDF file:', err);
        } else {
          console.log('Successfully cleaned up PDF file:', filePath);
        }
      });
    });

    console.log('Task completed successfully for:', email);
  } catch (error) {
    console.error('Error processing task for:', email, error);
    
    // Send error email with a generic message
    await queueEmail(
      email,
      'Error Processing Your Audio',
      `We encountered an unexpected error while processing your audio. Please try again later. If the issue persists, contact support.`
    );

    // Clean up the uploaded audio file
    fs.unlink(audioPath, (err) => {
      if (err) {
        console.error('Error deleting audio file:', err);
      } else {
        console.log('Successfully cleaned up audio file after error:', audioPath);
      }
    });

    // Clean up the generated PDF files in case of an error during PDF generation or email sending
    [transcriptionPdfFilePath, notesPdfFilePath].forEach((filePath) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting PDF file after error:', err);
        } else {
          console.log('Successfully cleaned up PDF file after error:', filePath);
        }
      });
    });
  }
}

// Function to process the task queue
async function processQueue() {
  if (isProcessingQueue || taskQueue.length === 0) {
    return;
  }

  console.log('Starting to process queue. Tasks in queue:', taskQueue.length);
  isProcessingQueue = true;
  
  while (taskQueue.length > 0) {
    const task = taskQueue[0];
    console.log('Processing next task in queue for:', task.email);
    await processTask(task);
    taskQueue.shift(); // Remove the processed task
    console.log('Tasks remaining in queue:', taskQueue.length);
  }
  
  isProcessingQueue = false;
  console.log('Queue processing completed');
}

// Function to add a task to the queue
function queueTask(audioPath, email) {
  console.log('Adding new task to queue for:', email);
  taskQueue.push({ audioPath, email });
  console.log('Current queue size:', taskQueue.length);
  processQueue();
}

module.exports = {
  queueTask
}; 