import React, { useState, useRef } from 'react';
import { 
  Container, 
  Box, 
  Button, 
  Typography, 
  Paper,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  TextField,
  Stack,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import EmailIcon from '@mui/icons-material/Email';
import DescriptionIcon from '@mui/icons-material/Description';
import NotionSettings from './components/NotionSettings';
import PrivacyPolicy from './components/PrivacyPolicy';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import './components/NotionSettings.js'; // Ensure NotionSettings is imported to register its logic

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [useSystemAudio, setUseSystemAudio] = useState(false);
  const [showNotionSettings, setShowNotionSettings] = useState(false);
  const [notionConfig, setNotionConfig] = useState(null);
  const [email, setEmail] = useState('');
  const [notionWorkspaceName, setNotionWorkspaceName] = useState('');
  const [sendTranscriptionPdf, setSendTranscriptionPdf] = useState(true);
  const [sendNotesPdf, setSendNotesPdf] = useState(true);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStream = useRef(null);

  const startRecording = async () => {
    try {
      setError(null);
      console.log('Requesting audio permissions...');
      
      let stream;
      if (useSystemAudio) {
        try {
          // First get display media with both video and audio
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });

          // Log the stream details
          console.log('Display stream details:', {
            videoTracks: displayStream.getVideoTracks().map(t => ({
              label: t.label,
              enabled: t.enabled,
              muted: t.muted,
              readyState: t.readyState
            })),
            audioTracks: displayStream.getAudioTracks().map(t => ({
              label: t.label,
              enabled: t.enabled,
              muted: t.muted,
              readyState: t.readyState
            }))
          });

          // Check if we have audio tracks
          const audioTracks = displayStream.getAudioTracks();
          if (audioTracks.length === 0) {
            throw new Error('No audio tracks found. Please make sure to check "Share audio" in the dialog.');
          }

          // Check if any audio track is actually enabled
          const hasEnabledAudio = audioTracks.some(track => track.enabled && !track.muted);
          if (!hasEnabledAudio) {
            throw new Error('Audio track is muted or disabled. Please make sure audio is enabled.');
          }

          stream = displayStream;
        } catch (displayError) {
          console.error('Display media error:', displayError);
          if (displayError.name === 'NotAllowedError') {
            throw new Error('Please allow access to capture system audio when prompted.');
          } else {
            throw new Error(`Failed to capture system audio: ${displayError.message}`);
          }
        }
      } else {
        // Use microphone
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      }

      // Create MediaRecorder
      let mediaRecorder;
      try {
        // Try to create MediaRecorder with default options first
        mediaRecorder = new MediaRecorder(stream);
        console.log('MediaRecorder created with default options');
      } catch (recorderError) {
        console.error('Failed to create MediaRecorder with default options:', recorderError);
        throw new Error('Your browser does not support audio recording. Please try a different browser.');
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, chunks collected:', audioChunksRef.current.length);
        if (audioChunksRef.current.length === 0) {
          setError('No audio data was captured. Please try again.');
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        console.log('Audio blob created:', audioBlob.size, 'bytes');
        await processAudio(audioBlob);
      };

      // Start recording
      try {
        mediaRecorder.start(1000); // Collect data every second
        console.log('MediaRecorder started successfully');
        setIsRecording(true);
      } catch (startError) {
        console.error('Error starting MediaRecorder:', startError);
        throw new Error(`Failed to start recording: ${startError.message}`);
      }
    } catch (err) {
      console.error('Error in startRecording:', err);
      setError(err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          console.log('Stopping track:', track.label);
          track.stop();
        });
        setIsRecording(false);
      } catch (err) {
        console.error('Error stopping recording:', err);
        setError('Error stopping recording: ' + err.message);
      }
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      setIsProcessing(true);
      setError(null);
      setInfoMessage(null);
      console.log('Processing audio...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('email', email);
      formData.append('includeTranscriptionPdf', sendTranscriptionPdf);
      formData.append('includeNotesPdf', sendNotesPdf);

      // Always use regular transcribe endpoint for now
      const endpoint = '/transcribe';
      
      console.log('Sending to server endpoint:', endpoint);
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received server response:', data);
      
      if (data.status === 'queued') {
        setInfoMessage('Your audio has been queued for processing. You will receive an email when it\'s ready.');
        setTranscription(''); // Clear any previous transcription
      } else {
        setTranscription(data.text || '');
      }
    } catch (err) {
      console.error('Error in processAudio:', err);
      setError('Error processing audio: ' + err.message);
      setInfoMessage(null);
    } finally {
      setIsProcessing(false);
      setAudioBlob(null); // Clear the blob after processing
    }
  };

  const handleNotionSave = (config) => {
    setNotionConfig(config);
    setShowNotionSettings(false);
    setNotionWorkspaceName(config.workspace?.name || '');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <Router>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="md">
          <Box sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1" color="primary">
                Audio to Notes
              </Typography>
              <Link to="/privacy" style={{ textDecoration: 'none' }}>
                <Typography color="primary">Privacy Policy</Typography>
              </Link>
            </Box>

            {/* Main Content Card */}
            <Card elevation={3}>
              <CardContent>
                <Stack spacing={3}>
                  {/* Email Input */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Where should we send your notes?
                    </Typography>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email to receive transcription"
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Box>

                  <Divider />

                  {/* Recording Controls */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Record Your Audio
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        variant="contained"
                        color={isRecording ? "error" : "primary"}
                        onClick={isRecording ? stopRecording : startRecording}
                        startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                        disabled={isProcessing || !email}
                        size="large"
                        sx={{ minWidth: 200 }}
                      >
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                      </Button>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={useSystemAudio}
                            onChange={(e) => setUseSystemAudio(e.target.checked)}
                            disabled={isRecording}
                          />
                        }
                        label="Use System Audio"
                      />
                    </Stack>
                  </Box>

                  <Divider />

                  {/* PDF Options */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      PDF Options
                    </Typography>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={sendTranscriptionPdf}
                            onChange={(e) => setSendTranscriptionPdf(e.target.checked)}
                            disabled={isRecording}
                          />
                        }
                        label="Include Full Transcription PDF"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={sendNotesPdf}
                            onChange={(e) => setSendNotesPdf(e.target.checked)}
                            disabled={isRecording}
                          />
                        }
                        label="Include Structured Notes PDF"
                      />
                    </Stack>
                  </Box>

                  {/* Status Messages */}
                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                  {infoMessage && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {infoMessage}
                    </Alert>
                  )}
                  {transcription && (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Transcription:
                      </Typography>
                      <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                        {transcription}
                      </Typography>
                    </Paper>
                  )}

                  {/* Loading Indicator */}
                  {isProcessing && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <CircularProgress />
                    </Box>
                  )}

                  {/* Notion Status */}
                  {notionWorkspaceName && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Notes will be saved to Notion in: <strong>{notionWorkspaceName}</strong>
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Container>

        <Routes>
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App; 