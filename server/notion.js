const { Client } = require('@notionhq/client');

// Function to create a note in Notion with user-specific credentials
async function createNotionNote(text, userConfig) {
  try {
    console.log('Creating Notion note with config:', {
      hasApiKey: !!userConfig.notionApiKey,
      hasDatabaseId: !!userConfig.notionDatabaseId,
      noteTitle: userConfig.noteTitle,
      textLength: text.length
    });

    // Initialize Notion client with user's API key
    const notion = new Client({
      auth: userConfig.notionApiKey,
    });

    // Get the current date in a readable format
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create the page title with date
    const pageTitle = `${userConfig.noteTitle || 'Note'} - ${date}`;
    console.log('Creating page with title:', pageTitle);

    // Create a new page in the user's database
    console.log('Attempting to create page in database:', userConfig.notionDatabaseId);
    const response = await notion.pages.create({
      parent: {
        database_id: userConfig.notionDatabaseId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: pageTitle,
              },
            },
          ],
        },
        Date: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: text,
                },
              },
            ],
          },
        },
      ],
    });

    console.log('Successfully created Notion page:', {
      pageId: response.id,
      url: response.url
    });

    return {
      success: true,
      pageId: response.id,
      url: response.url
    };
  } catch (error) {
    console.error('Error creating Notion note:', {
      message: error.message,
      code: error.code,
      status: error.status,
      body: error.body
    });
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to validate Notion credentials
async function validateNotionCredentials(apiKey, databaseId) {
  try {
    const notion = new Client({
      auth: apiKey,
    });

    // Try to access the database
    await notion.databases.retrieve({
      database_id: databaseId,
    });

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createNotionNote,
  validateNotionCredentials
}; 