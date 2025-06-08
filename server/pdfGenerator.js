const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generatePdf(text, outputFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();

    const writeStream = fs.createWriteStream(outputFilePath);
    doc.pipe(writeStream);

    doc.fontSize(12).text(text, 50, 50);

    doc.end();

    writeStream.on('finish', () => {
      console.log(`PDF generated at: ${outputFilePath}`);
      resolve(outputFilePath);
    });

    writeStream.on('error', (err) => {
      console.error('Error writing PDF file:', err);
      reject(err);
    });
  });
}

module.exports = { generatePdf }; 