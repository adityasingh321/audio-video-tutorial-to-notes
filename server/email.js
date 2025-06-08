const nodemailer = require('nodemailer');

// Validate email configuration
function validateEmailConfig() {
  const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  // console.log(process.env);
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required email configuration: ${missingVars.join(', ')}. Please check your .env file.`);
  }
}

// Create a transporter using environment variables
let transporter;
try {
  validateEmailConfig();
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('Email transporter configured successfully');
} catch (error) {
  console.error('Error configuring email:', error.message);
  // Create a dummy transporter that will fail gracefully
  transporter = {
    sendMail: async () => {
      throw new Error('Email not configured. Please set up EMAIL_USER and EMAIL_PASSWORD in .env file.');
    }
  };
}

// Queue to store pending emails
const emailQueue = [];
let isProcessingQueue = false;

// Function to send email
async function sendEmail(to, subject, text, attachments = []) {
  try {
    if (!to || !subject || !text) {
      throw new Error('Missing required email fields');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Function to add email to queue
function queueEmail(to, subject, text, attachments = []) {
  if (!to || !subject || !text) {
    console.error('Cannot queue email: missing required fields');
    return;
  }
  emailQueue.push({ to, subject, text, attachments });
  processEmailQueue();
}

// Function to process email queue
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  while (emailQueue.length > 0) {
    const email = emailQueue[0];
    const success = await sendEmail(email.to, email.subject, email.text, email.attachments);
    if (success) {
      emailQueue.shift(); // Remove the processed email
    } else {
      // If sending fails, wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  isProcessingQueue = false;
}

module.exports = {
  queueEmail
}; 