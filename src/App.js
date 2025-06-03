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
  Switch
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [useSystemAudio, setUseSystemAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      console.log('Processing audio...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      console.log('Sending to server...');
      const response = await fetch('http://localhost:3001/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received transcription:', data);
      setTranscription(data.text);
    } catch (err) {
      console.error('Error in processAudio:', err);
      setError('Error processing audio: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Audio to Text
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
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
          
          <Button
            variant="contained"
            color={isRecording ? "error" : "primary"}
            onClick={isRecording ? stopRecording : startRecording}
            startIcon={isRecording ? <StopIcon /> : <MicIcon />}
            disabled={isProcessing}
            sx={{ minWidth: 200, mt: 2 }}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </Box>

        {isProcessing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {transcription && (
          <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Transcription:
            </Typography>
            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
              {transcription}
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default App; 