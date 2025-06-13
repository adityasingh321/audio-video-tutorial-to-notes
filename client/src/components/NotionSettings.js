import React, { useState, useEffect } from 'react';

function NotionSettings({ onSave, initialConfig }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState(initialConfig?.selectedDatabase || '');
  const [noteTitle, setNoteTitle] = useState(initialConfig?.noteTitle || 'Note');
  const [workspace, setWorkspace] = useState(initialConfig?.workspace || null);
  const [databases, setDatabases] = useState(initialConfig?.databases || []);
  const [accessToken, setAccessToken] = useState(initialConfig?.accessToken || null);

  useEffect(() => {
    const messageHandler = (event) => {
      console.log('Received message in useEffect:', event.data);
      if (event.data.type === 'notion-oauth-callback') {
        const callbackData = event.data.payload;
        console.log('Notion OAuth Callback Data:', callbackData);

        if (callbackData.success) {
          setWorkspace(callbackData.workspace);
          setDatabases(callbackData.databases);
          setAccessToken(callbackData.access_token);
          setSuccess(true);
        } else {
          setError(callbackData.error || 'Failed to connect to Notion');
        }
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const connectNotion = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Requesting auth URL...');
      const response = await fetch('http://localhost:3001/notion-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Read as text if not OK
        throw new Error(`Server responded with status ${response.status}: ${errorText.substring(0, 200)}...`);
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error('No auth URL received from server');
      }
      
      console.log('Opening Notion auth page...');
      const popup = window.open(data.url, 'Connect with Notion', 'width=600,height=700');
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

    } catch (err) {
      console.error('Error connecting to Notion:', err);
      setError('Error connecting to Notion: ' + err.message);
      setIsConnecting(false);
    }
  };

  const handleSaveSettings = () => {
    if (workspace && selectedDatabase && accessToken) {
      onSave({
        accessToken: accessToken,
        workspace: workspace,
        databases: databases,
        selectedDatabase: selectedDatabase,
        noteTitle: noteTitle,
      });
      setSuccess(true);
    } else {
      setError('Please select a database and ensure Notion is connected.');
    }
  };

  return (
    <div className="notion-settings">
      <h2>Notion Integration</h2>
      
      {!workspace ? (
        <button 
          onClick={connectNotion}
          disabled={isConnecting}
          className="connect-button"
        >
          {isConnecting ? 'Connecting...' : 'Connect with Notion'}
        </button>
      ) : (
        <div className="workspace-info">
          <h3>Connected to {workspace.name}</h3>
          <div className="form-group">
            <label htmlFor="database">Select Database:</label>
            <select
              id="database"
              value={selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value)}
            >
              <option value="">Select a database</option>
              {databases.map(db => (
                <option key={db.id} value={db.id}>
                  {db.title[0]?.plain_text || 'Untitled Database'}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="noteTitle">Note Title Prefix:</label>
            <input
              type="text"
              id="noteTitle"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter note title prefix"
            />
          </div>
          <button 
            onClick={handleSaveSettings}
            disabled={!selectedDatabase}
            className="connect-button"
          >
            Save Notion Settings
          </button>
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">Successfully connected to Notion!</div>}
      
      <div className="help-text">
        <h3>How to use Notion integration:</h3>
        <ol>
          <li>Click "Connect with Notion"</li>
          <li>Log in to your Notion account</li>
          <li>Grant access to the app</li>
          <li>Select a database for your notes</li>
          <li>Start recording!</li>
        </ol>
      </div>
    </div>
  );
}

export default NotionSettings; 