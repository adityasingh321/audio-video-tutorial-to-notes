const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const commonmark = require('commonmark');
const CommonmarkPDFRenderer = require('pdfkit-commonmark').default;

// Function to generate PDF for transcription only
async function generateTranscriptionPdf(transcriptionText, outputFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputFilePath);
    doc.pipe(writeStream);

    const margin = 50;
    const contentWidth = doc.page.width - 2 * margin;

    doc.fontSize(16).text('Transcription', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(transcriptionText, margin, doc.y, { width: contentWidth, align: 'left' });

    doc.end();

    writeStream.on('finish', () => {
      console.log(`Transcription PDF generated at: ${outputFilePath}`);
      resolve(outputFilePath);
    });

    writeStream.on('error', (err) => {
      console.error('Error writing Transcription PDF file:', err);
      reject(err);
    });
  });
}

// Function to generate PDF for notes only (with Markdown rendering)
async function generateNotesPdf(notesText, outputFilePath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(outputFilePath);
        doc.pipe(writeStream);

        const margin = 50; // General margin for left and right
        const contentWidth = doc.page.width - 2 * margin;

        doc.fontSize(16).text('Structured Notes', { align: 'center' });
        doc.moveDown();

        // Use commonmark and pdfkit-commonmark to render notes
        const reader = new commonmark.Parser();
        const parsed = reader.parse(notesText);
        
        const writer = new CommonmarkPDFRenderer(); // Instantiate without arguments

        writer.render(doc, parsed, {
            x: margin,
            y: doc.y,
            width: contentWidth,
            padding: 0,
            fontSize: 12,
            font: 'Helvetica',
            lineHeight: 1.2,
            paragraphSpacing: 10,
            listIndent: 20,
            h1FontSize: 16,
            h2FontSize: 14,
            h3FontSize: 13,
            h1Font: 'Helvetica-Bold',
            h2Font: 'Helvetica-Bold',
            h3Font: 'Helvetica-Bold',
        });
        
        doc.end();

        writeStream.on('finish', () => {
            console.log(`Notes PDF generated at: ${outputFilePath}`);
            resolve(outputFilePath);
        });

        writeStream.on('error', (err) => {
            console.error('Error writing Notes PDF file:', err);
            reject(err);
        });
    });
}

module.exports = {
  generateTranscriptionPdf,
  generateNotesPdf,
}; 