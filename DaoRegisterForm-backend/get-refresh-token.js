require('dotenv').config();
const express = require('express');
const http = require('http'); // Use HTTP instead of HTTPS to avoid certificate issues
const fs = require('fs');
const path = require('path');
const jsforce = require('jsforce');

const app = express();
const PORT = 3010;
const HOST = 'localhost';

// OAuth2 configuration
const oauth2 = new jsforce.OAuth2({
  loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
  clientId: process.env.SALESFORCE_CLIENT_ID,
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
  redirectUri: `http://localhost:${PORT}/oauth/callback` // HTTP callback
});

console.log('\n🔐 Salesforce OAuth Setup Tool\n');
console.log('This will help you get a REFRESH TOKEN that never expires!\n');

// Step 1: Start authorization
app.get('/auth', (req, res) => {
  const authUrl = oauth2.getAuthorizationUrl({ scope: 'api refresh_token offline_access' });
  console.log('📋 Authorization URL generated');
  res.redirect(authUrl);
});

// Step 2: Handle callback
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    console.error('❌ No authorization code received');
    return res.send('Error: No authorization code');
  }

  try {
    console.log('🔄 Exchanging code for tokens...');
    
    const conn = new jsforce.Connection({ oauth2 });
    const userInfo = await conn.authorize(code);
    
    console.log('\n✅ SUCCESS! Tokens received:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Copy these values to your .env file:\n');
    console.log(`SALESFORCE_INSTANCE_URL=${conn.instanceUrl}`);
    console.log(`SALESFORCE_REFRESH_TOKEN=${conn.refreshToken}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ This refresh token will automatically renew and never expire!');
    console.log('🔒 Keep it secret and never commit to git\n');

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
            h1 { color: #155724; }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✅ Success! Refresh Token Generated</h1>
            <p>Copy these values to your <code>.env</code> file:</p>
            <pre>SALESFORCE_INSTANCE_URL=${conn.instanceUrl}
SALESFORCE_REFRESH_TOKEN=${conn.refreshToken}</pre>
            <p><strong>⚠️ Important:</strong> This refresh token will automatically renew and never expire!</p>
            <p>You can close this window and stop the server (Ctrl+C)</p>
          </div>
        </body>
      </html>
    `);

    console.log('You can now close this server (Ctrl+C) and start your main app!');
    
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
    res.send(`Error: ${error.message}`);
  }
});

// Start HTTP server
http.createServer(app).listen(PORT, HOST, () => {
  console.log(`✅ OAuth HTTP server started on http://${HOST}:${PORT}\n`);
  console.log('📋 Steps to get your refresh token:\n');
  console.log(`1. Make sure SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET are set in .env`);
  console.log(`2. Open your browser and go to: http://${HOST}:${PORT}/auth`);
  console.log(`3. Login to Salesforce and approve the app`);
  console.log(`4. Copy the SALESFORCE_REFRESH_TOKEN to your .env file`);
  console.log(`5. Stop this server (Ctrl+C) and start your main app\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
