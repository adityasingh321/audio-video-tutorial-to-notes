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
  ListItemText,
  Grid,
  Fade,
  Slide,
  Grow,
  Zoom
} from '@mui/material';
import { ThemeProvider, styled } from '@mui/material/styles';
import theme from './theme';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import EmailIcon from '@mui/icons-material/Email';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import ComputerIcon from '@mui/icons-material/Computer';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import ArticleIcon from '@mui/icons-material/Article';
import NotesIcon from '@mui/icons-material/Notes';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Styled Components
const GradientBox = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  color: theme.palette.primary.contrastText,
  width: '100%',
  borderRadius: '0 0 24px 24px',
  boxShadow: theme.shadows[10],
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: theme.palette.secondary.main,
  }
}));

const FloatingActionCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  boxShadow: theme.shadows[6],
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[12],
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: theme.palette.secondary.main,
    borderRadius: '0 0 16px 16px'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.action.hover,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
  },
  '& .MuiInputBase-input': {
    padding: '14px 16px',
  },
}));

const RecordButton = styled(Button)(({ theme, isrecording }) => ({
  borderRadius: '12px',
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
  boxShadow: isrecording === 'true' 
    ? `0 4px 0 ${theme.palette.error.dark}, 0 6px 12px rgba(0, 0, 0, 0.1)` 
    : `0 4px 0 ${theme.palette.secondary.dark}, 0 6px 12px rgba(0, 0, 0, 0.1)`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: isrecording === 'true' 
      ? `0 6px 0 ${theme.palette.error.dark}, 0 8px 16px rgba(0, 0, 0, 0.15)` 
      : `0 6px 0 ${theme.palette.secondary.dark}, 0 8px 16px rgba(0, 0, 0, 0.15)`,
  },
  '&:active': {
    transform: 'translateY(2px)',
    boxShadow: isrecording === 'true' 
      ? `0 2px 0 ${theme.palette.error.dark}, 0 3px 6px rgba(0, 0, 0, 0.1)` 
      : `0 2px 0 ${theme.palette.secondary.dark}, 0 3px 6px rgba(0, 0, 0, 0.1)`,
  },
  '& .MuiButton-startIcon': {
    marginRight: '8px',
  }
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 8px 24px ${theme.palette.primary.light}20`,
  }
}));

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
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });

          const audioTracks = displayStream.getAudioTracks();
          if (audioTracks.length === 0) {
            throw new Error('No audio tracks found. Please make sure to check "Share audio" in the dialog.');
          }

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
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      }

      let mediaRecorder;
      try {
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

      try {
        mediaRecorder.start(1000);
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
        setTranscription('');
      } else {
        setTranscription(data.text || '');
      }
    } catch (err) {
      console.error('Error in processAudio:', err);
      setError('Error processing audio: ' + err.message);
      setInfoMessage(null);
    } finally {
      setIsProcessing(false);
      setAudioBlob(null);
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
            width: '100%',
          }}
        >
          {/* Hero Section */}
          <GradientBox>
            <Container maxWidth="lg" sx={{ py: 8 }}>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Slide direction="right" in={true} mountOnEnter unmountOnExit>
                    <Box>
                      <Typography 
                        variant="h3" 
                        component="h1" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 800,
                          mb: 2,
                          lineHeight: 1.2
                        }}
                      >
                        Transform Audio into Organized Notes
                      </Typography>
                      <Typography 
                        variant="h6" 
                        component="h2" 
                        sx={{ 
                          opacity: 0.9,
                          mb: 4,
                          fontWeight: 400
                        }}
                      >
                        Capture lectures, meetings, or ideas and get beautifully formatted notes delivered to your inbox.
                      </Typography>
                    </Box>
                  </Slide>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Fade in={true} timeout={800}>
                    <FloatingActionCard>
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3}>
                          <StyledTextField
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            label="Your email address"
                            placeholder="example@email.com"
                            InputProps={{
                              startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                            fullWidth
                          />
                          
                          <RecordButton
                            variant="contained"
                            color={isRecording ? "error" : "secondary"}
                            onClick={isRecording ? stopRecording : startRecording}
                            startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                            disabled={isProcessing || !email}
                            isrecording={isRecording.toString()}
                            fullWidth
                            size="large"
                          >
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                          </RecordButton>

                          <Divider sx={{ my: 1 }} />

                          <Stack direction="row" spacing={2} alignItems="center">
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={useSystemAudio}
                                  onChange={(e) => setUseSystemAudio(e.target.checked)}
                                  disabled={isRecording}
                                  color="secondary"
                                />
                              }
                              label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {useSystemAudio ? <ComputerIcon fontSize="small" /> : <HeadsetMicIcon fontSize="small" />}
                                  <Typography variant="body2">
                                    {useSystemAudio ? 'System Audio' : 'Microphone'}
                                  </Typography>
                                </Stack>
                              }
                            />

                            <Button 
                              startIcon={<SettingsIcon />}
                              onClick={() => setShowNotionSettings(!showNotionSettings)}
                              size="small"
                              sx={{ ml: 'auto' }}
                            >
                              Settings
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </FloatingActionCard>
                  </Fade>
                </Grid>
              </Grid>
            </Container>
          </GradientBox>

          {/* Main Content */}
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Grid container spacing={4}>
              {/* PDF Options Card */}
              <Grid item xs={12} md={6}>
                <Grow in={true} timeout={1000}>
                  <FeatureCard>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                        <NotesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Output Options
                      </Typography>
                      <Stack spacing={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={sendTranscriptionPdf}
                              onChange={(e) => setSendTranscriptionPdf(e.target.checked)}
                              disabled={isRecording}
                              color="secondary"
                            />
                          }
                          label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <ArticleIcon fontSize="small" />
                              <Typography variant="body2">
                                Include Full Transcription
                              </Typography>
                            </Stack>
                          }
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={sendNotesPdf}
                              onChange={(e) => setSendNotesPdf(e.target.checked)}
                              disabled={isRecording}
                              color="secondary"
                            />
                          }
                          label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <DescriptionIcon fontSize="small" />
                              <Typography variant="body2">
                                Include Structured Notes
                              </Typography>
                            </Stack>
                          }
                        />
                      </Stack>
                    </CardContent>
                  </FeatureCard>
                </Grow>
              </Grid>

              {/* Status Card */}
              <Grid item xs={12} md={6}>
                <Zoom in={true} timeout={1200}>
                  <FeatureCard>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                        Status
                      </Typography>
                      <Stack spacing={3}>
                        {error && (
                          <Alert severity="error" sx={{ borderRadius: 2 }}>
                            {error}
                          </Alert>
                        )}
                        {infoMessage && (
                          <Alert severity="info" sx={{ borderRadius: 2 }}>
                            {infoMessage}
                          </Alert>
                        )}
                        {isProcessing && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress color="secondary" />
                            <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
                              Processing your audio...
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </FeatureCard>
                </Zoom>
              </Grid>

              {/* Transcription Card */}
              {transcription && (
                <Grid item xs={12}>
                  <Slide direction="up" in={!!transcription} mountOnEnter unmountOnExit>
                    <FeatureCard>
                      <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                          Transcription Preview
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            maxHeight: '400px',
                            overflowY: 'auto'
                          }}
                        >
                          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                            {transcription}
                          </Typography>
                        </Paper>
                      </CardContent>
                    </FeatureCard>
                  </Slide>
                </Grid>
              )}

              {/* How to Use Section */}
              <Grid item xs={12}>
                <Fade in={true} timeout={1500}>
                  <FeatureCard>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                        How It Works
                      </Typography>
                      <Grid container spacing={3}>
                        {[
                          {
                            icon: <EmailIcon color="primary" />,
                            title: "Enter Your Email",
                            description: "Provide your email address where your transcribed audio and generated notes will be sent."
                          },
                          {
                            icon: <HeadsetMicIcon color="primary" />,
                            title: "Choose Audio Source",
                            description: "Select between microphone for voice recording or system audio for capturing computer sound."
                          },
                          {
                            icon: <MicIcon color="primary" />,
                            title: "Start Recording",
                            description: "Click the record button to begin capturing audio. Speak clearly for best results."
                          },
                          {
                            icon: <StopIcon color="primary" />,
                            title: "Stop Recording",
                            description: "Click stop when finished. Your audio will automatically be processed."
                          },
                          {
                            icon: <DescriptionIcon color="primary" />,
                            title: "Receive Notes",
                            description: "Get an email with both the full transcription and structured notes as PDFs."
                          },
                          {
                            icon: <SettingsIcon color="primary" />,
                            title: "Customize Output",
                            description: "Choose whether to include the full transcription, structured notes, or both."
                          }
                        ].map((step, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                              <Box sx={{
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mt: 0.5
                              }}>
                                {step.icon}
                              </Box>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                  {step.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {step.description}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </FeatureCard>
                </Fade>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </ThemeProvider>
    </Router>
  );
}

export default App;