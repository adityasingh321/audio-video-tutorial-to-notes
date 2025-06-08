import React from 'react';

function PrivacyPolicy() {
  return (
    <div className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <section>
        <h2>Introduction</h2>
        <p>Audio to Notes is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our application.</p>
      </section>

      <section>
        <h2>Information We Collect</h2>
        <ul>
          <li><strong>Audio Recordings:</strong> We process your audio recordings to convert them into text notes.</li>
          <li><strong>Notion Integration:</strong> We store your Notion access token to save notes to your Notion workspace.</li>
          <li><strong>Usage Data:</strong> We collect basic usage statistics to improve our service.</li>
        </ul>
      </section>

      <section>
        <h2>How We Use Your Information</h2>
        <ul>
          <li>To convert your audio recordings into text</li>
          <li>To save notes to your Notion workspace</li>
          <li>To improve our application</li>
        </ul>
      </section>

      <section>
        <h2>Data Storage</h2>
        <p>Your audio recordings are processed locally and are not stored on our servers. The transcribed text is only sent to your Notion workspace.</p>
      </section>

      <section>
        <h2>Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Notion:</strong> For storing your notes</li>
          <li><strong>Whisper AI:</strong> For audio transcription</li>
        </ul>
      </section>

      <section>
        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your data</li>
          <li>Delete your data</li>
          <li>Disconnect your Notion integration</li>
        </ul>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p>Email: [Your Contact Email]</p>
      </section>
    </div>
  );
}

export default PrivacyPolicy; 