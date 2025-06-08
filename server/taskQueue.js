const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { queueEmail } = require('./email');
const { generatePdf } = require('./pdfGenerator');

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

# Load model only once at startup
if 'model' not in globals():
    model = whisper.load_model("base")

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
    console.log('Transcription completed, generating PDF for:', email);

    // Generate PDF
    const pdfFileName = `transcription-${Date.now()}.pdf`;
    pdfFilePath = path.join(__dirname, 'uploads', pdfFileName);
    await generatePdf(transcription, pdfFilePath);

    // Read the PDF file into a buffer before sending
    const pdfBuffer = await fs.promises.readFile(pdfFilePath);

    console.log('PDF generated and read into buffer, sending email to:', email);
    
    // Send success email with PDF attachment
    await queueEmail(
      email,
      'Your Audio Transcription is Ready',
      `Here is your transcription as a PDF attachment.`, // Changed text to indicate attachment
      [
        {
          filename: pdfFileName,
          content: pdfBuffer, // Pass buffer instead of path
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

    // Clean up the generated PDF file immediately after reading into buffer
    if (pdfFilePath) {
      fs.unlink(pdfFilePath, (err) => {
        if (err) {
          console.error('Error deleting PDF file:', err);
        } else {
          console.log('Successfully cleaned up PDF file:', pdfFilePath);
        }
      });
    }

    console.log('Task completed successfully for:', email);
  } catch (error) {
    console.error('Error processing task for:', email, error);
    
    // Send error email
    await queueEmail(
      email,
      'Error Processing Your Audio',
      `We encountered an error while processing your audio:\n\n${error.message}\n\nPlease try again or contact support if the issue persists.`
    );

    // Clean up the uploaded audio file
    fs.unlink(audioPath, (err) => {
      if (err) {
        console.error('Error deleting audio file:', err);
      } else {
        console.log('Successfully cleaned up audio file after error:', audioPath);
      }
    });

    // Clean up the generated PDF file in case of an error during PDF generation or email sending
    if (pdfFilePath) {
      fs.unlink(pdfFilePath, (err) => {
        if (err) {
          console.error('Error deleting PDF file after error:', err);
        } else {
          console.log('Successfully cleaned up PDF file after error:', pdfFilePath);
        }
      });
    }
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