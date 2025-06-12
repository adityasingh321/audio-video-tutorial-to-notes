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
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { ThemeProvider, styled } from '@mui/material/styles';
import theme from './theme';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import EmailIcon from '@mui/icons-material/Email';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For checkmark in usage list

import NotionSettings from './components/NotionSettings';
import PrivacyPolicy from './components/PrivacyPolicy';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import './components/NotionSettings.js'; // Ensure NotionSettings is imported to register its logic

const HeaderLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: theme.palette.background.dark, // Use background.dark for the hero section
  color: theme.palette.primary.contrastText, // White text
  py: 6, // Padding top and bottom
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)', // Subtle shadow for depth
}));

const MainContentArea = styled(Box)(({ theme }) => ({
  bgcolor: theme.palette.background.default, // White background for main content
  width: '100%',
  py: 4,
}));

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null); // New state for informational messages
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
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pb: 8, // Padding bottom for footer
            width: '100%',
          }}
        >
          {/* Hero Section */}
          <HeroSection>
            <Container maxWidth="lg"> {/* Changed to 'lg' for more horizontal space and consistent alignment */}
              <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {/* Increased padding for more vertical space, added flex for content centering */}
                {/* Header */}
                <Typography variant="h5" component="h1" color="primary.contrastText" sx={{ mb: 1 }}> {/* Removed align="center", adjusted mb */}
                  Audio to Notes
                </Typography>

                <Typography variant="h3" component="h2" gutterBottom color="primary.contrastText" sx={{ mb: 4, maxWidth: '600px' }}> {/* Removed align="center", removed mx: 'auto' */}
                  Turn your audio into organized notes and summaries.
                </Typography>

                {/* Centralized Controls Block */}
                <Stack spacing={3} sx={{ width: '100%', maxWidth: '500px', alignItems: 'center' }}> {/* New Stack for centralizing controls, reduced mb for next element */}
                  <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}> {/* Reduced mb, added alignItems: 'center' for vertical alignment, width 100% */}
                    <TextField
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email to receive notes"
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: theme => theme.palette.text.secondary }} /> // Revert to theme color for email icon
                      }}
                      sx={{
                        bgcolor: 'background.paper', // White background for input
                        borderRadius: 8,
                        flexGrow: 1,
                        height: 56, // Explicit height to align with button
                        '& .MuiInputBase-input': {
                          padding: '14px 16px', // Re-confirming padding
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      color={isRecording ? "error" : "secondary"}
                      onClick={isRecording ? stopRecording : startRecording}
                      startIcon={isRecording ? <StopIcon sx={{ color: 'white' }} /> : <MicIcon sx={{ color: 'white' }} />} // Mic/Stop icon color explicitly white
                      disabled={isProcessing || !email}
                      size="medium"
                      sx={{ width: 180, color: 'white', height: 56 }} // Fixed width and explicit white text color for the button
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                  </Stack>

                  {/* Audio Source and PDF Options - Now part of Centralized Controls Block */}
                  <Stack direction="row" spacing={3} sx={{ width: '100%', justifyContent: 'center' }}> {/* New Stack to arrange cards side-by-side */}
                    <Card elevation={3} sx={{ width: '50%', maxWidth: '400px' }}> {/* Card for system audio toggle */}
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="text.secondary">
                          Audio Source
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={useSystemAudio}
                              onChange={(e) => setUseSystemAudio(e.target.checked)}
                              disabled={isRecording}
                            />
                          }
                          label="Use System Audio (for capturing computer audio)"
                        />
                      </CardContent>
                    </Card>

                    {/* PDF Options */}
                    <Card elevation={3} sx={{ width: '50%', maxWidth: '400px' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="text.secondary">
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
                      </CardContent>
                    </Card>
                  </Stack>
                </Stack>

              </Box>
            </Container>
          </HeroSection>

          {/* Main Content Area (white background) */}
          <MainContentArea>
            <Container maxWidth="md"> {/* Adjusted to 'md' for wider content width */}
              <Box sx={{ py: 8 }}> {/* Increased padding for main content area */}

                {/* Status Messages - Now in MainContentArea */}
                <Card elevation={3}> 
                  <CardContent>
                    <Stack spacing={4}> 
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
                        <Paper variant="outlined" sx={{ p: 3, mt: 3, bgcolor: 'background.paper' }}> 
                          <Typography variant="subtitle1" color="text.primary" gutterBottom> 
                            Transcription:
                          </Typography>
                          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}> 
                            {transcription}
                          </Typography>
                        </Paper>
                      )}

                      {/* Loading Indicator */}
                      {isProcessing && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}> 
                          <CircularProgress />
                        </Box>
                      )}

                      {/* Notion Status - Keep hidden for now as per user request */}
                      {/* {notionWorkspaceName && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Notes will be saved to Notion in: <strong>{notionWorkspaceName}</strong>
                        </Alert>
                      )} */}
                    </Stack>
                  </CardContent>
                </Card>

                {/* How to Use Section */}
                <Card elevation={3} sx={{ mt: 4 }}> 
                  <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom color="primary" align="center">
                      How to Use
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleOutlineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText>
                          <Typography variant="body1">
                            <strong>Step 1: Enter Your Email.</strong> Provide your email address in the field above. This is where your transcribed audio and generated notes will be sent.
                          </Typography>
                        </ListItemText>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleOutlineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText>
                          <Typography variant="body1">
                            <strong>Step 2: Choose Audio Source.</strong> Select "Microphone" to record your voice or "Use System Audio" to capture sound directly from your computer (e.g., from a tutorial video).
                          </Typography>
                        </ListItemText>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleOutlineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText>
                          <Typography variant="body1">
                            <strong>Step 3: Start Recording.</strong> Click the "Start Recording" button to begin capturing audio. Make sure your microphone is enabled or system audio is being shared.
                          </Typography>
                        </ListItemText>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleOutlineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText>
                          <Typography variant="body1">
                            <strong>Step 4: Stop Recording.</strong> Click "Stop Recording" when you're finished. The application will automatically process the audio.
                          </Typography>
                        </ListItemText>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleOutlineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText>
                          <Typography variant="body1">
                            <strong>Step 5: Receive Notes.</strong> Your audio will be transcribed, and structured notes will be generated. You'll receive an email with both the full transcription and the notes as PDFs.
                          </Typography>
                        </ListItemText>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleOutlineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText>
                          <Typography variant="body1">
                            <strong>Optional: PDF Options.</strong> Before recording, use the checkboxes to choose whether to include the full transcription PDF, the structured notes PDF, or both, in your email.
                          </Typography>
                        </ListItemText>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>

              </Box>
            </Container>
          </MainContentArea>

          <Routes>
            {/* <Route path="/privacy" element={<PrivacyPolicy />} /> */}
          </Routes>
        </Box>
      </ThemeProvider>
    </Router>
  );
}

export default App; 