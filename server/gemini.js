const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable
const API_KEY = process.env.GEMINI_API_KEY;

// Validate API Key
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in the environment variables. Please set it in your .env file.");
  // Optionally, you might want to throw an error or exit the process here
  // For now, we'll allow the process to continue but warn about the missing key.
}

// Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

async function generateNotesWithGemini(transcriptionText) {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing. Cannot generate notes.");
  }

  const prompt = `You are an expert note-taker creating a clear and concise summary. Your task is to transform the following audio transcription into well-structured, easy-to-understand notes.

Focus on the core technical concepts, explanations, and key applications.

Specifically, ensure the notes:
- Directly summarize the main topics and key details.
- Provide a clear, step-by-step explanation of any examples given.
- Avoid mentioning or referring to the original transcription (e.g., "The transcription states...", "As mentioned in the audio...").
- **Do NOT** include any sections or points about external resources, calls to action (like "check out this video," "subscribe"), or "further learning" prompts from the original content.

Format the notes using headings and bullet points for maximum readability.

---
Transcription:
${transcriptionText}
---

Structured Notes:`;

  try {
    console.log("Sending request to Gemini for note generation...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini note generation successful.");
    return text;
  } catch (error) {
    console.error("Error generating notes with Gemini:", error);
    throw new Error(`Failed to generate notes: ${error.message}`);
  }
}

module.exports = { generateNotesWithGemini }; 