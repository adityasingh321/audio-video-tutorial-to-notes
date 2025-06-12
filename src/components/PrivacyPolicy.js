import React from 'react';
import { Box, Typography, Container, Paper, List, ListItem, ListItemText } from '@mui/material';

function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: '15px' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Introduction
          </Typography>
          <Typography variant="body1">
            Audio to Notes is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our application.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Information We Collect
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body1">
                    <strong>Audio Recordings:</strong> We process your audio recordings locally to convert them into text notes. We do not store your raw audio on our servers.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body1">
                    <strong>Email Address:</strong> We collect your email address solely for the purpose of sending you your transcribed audio and generated notes.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body1">
                    <strong>Usage Data:</strong> We collect basic, anonymized usage statistics to improve our service (e.g., number of transcriptions).
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            How We Use Your Information
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="To convert your audio recordings into text." />
            </ListItem>
            <ListItem>
              <ListItemText primary="To generate structured notes from your transcriptions." />
            </ListItem>
            <ListItem>
              <ListItemText primary="To send you transcribed audio and generated notes via email." />
            </ListItem>
            <ListItem>
              <ListItemText primary="To improve our application's performance and features." />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Data Storage
          </Typography>
          <Typography variant="body1">
            Your audio recordings are processed locally on your machine and temporarily on our local backend server for transcription and note generation. They are deleted immediately after processing and email delivery. We do not store your audio recordings or their transcriptions/notes on our long-term servers.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Third-Party Services
          </Typography>
          <Typography variant="body1">
            We use the following third-party services:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body1">
                    <strong>Local Whisper Server:</strong> For transcribing your audio recordings. This runs on your local machine and our local backend server.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body1">
                    <strong>Google Gemini 1.5 Flash:</strong> For generating structured notes from the transcribed text.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body1">
                    <strong>Email Service (e.g., Nodemailer):</strong> For sending emails containing your notes and transcriptions. Your email address is used only for this purpose.
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Your Rights
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Access your data." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Delete your data (by not providing your email or by deleting received emails)." />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Changes to This Privacy Policy
          </Typography>
          <Typography variant="body1">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom>
            Contact Us
          </Typography>
          <Typography variant="body1">
            If you have any questions about this Privacy Policy, please contact us at:
          </Typography>
          <Typography variant="body1">
            Email: [Your Contact Email]
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default PrivacyPolicy; 