# Audio to Notes

A web application that captures audio from your browser while watching tutorials, transcribes it using OpenAI's Whisper API, and converts it into organized notes using GPT-3.5.

## Features

- Capture audio from your browser while watching tutorials
- Real-time audio recording with start/stop controls
- Automatic transcription using OpenAI's Whisper API
- Conversion of transcriptions into organized notes using GPT-3.5
- Modern, responsive UI built with Material-UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd audio-to-notes
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Usage

1. Open the application in your browser
2. Click the "Start Recording" button when you want to begin capturing audio from your tutorial
3. The application will continue recording until you click "Stop Recording"
4. Once stopped, the application will:
   - Transcribe the audio using Whisper API
   - Convert the transcription into organized notes using GPT-3.5
   - Display both the transcription and the generated notes

## Important Notes

- Make sure your browser has permission to access your microphone
- The application works best with clear audio input
- Keep your OpenAI API key secure and never commit it to version control
- The application requires an active internet connection to use the OpenAI APIs

## License

MIT 