# DaoRegisterForm Backend

Backend API for supplier registration form with Salesforce integration.

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update:
```bash
cp .env.example .env
```

Update the following variables:
- `HOST` - Your server IP address (e.g., `10.69.2.132`)
- `PORT` - Server port (default: `3001`)
- `SALESFORCE_CLIENT_ID` - From your Salesforce Connected App
- `SALESFORCE_CLIENT_SECRET` - From your Salesforce Connected App

### 3. Generate SSL Certificates (First Time Only)
```bash
node generate-certs.js
```

### 4. Start Server
```bash
npm start
```

## 📋 OAuth Flow

1. **Login**: Open `https://YOUR_HOST:3001/login`
2. Login to Salesforce and approve the app
3. Access token is stored in memory
4. Submit forms from frontend

## 🔧 API Endpoints

- `POST /api/supplier` - Create supplier in Salesforce (requires authentication)
- `GET /api/health` - Health check
- `GET /login` - Initiate OAuth flow
- `GET /oauth/callback` - OAuth callback handler

## 🔐 Connected App Requirements

In your Salesforce Connected App, ensure:
- ✅ Enable OAuth
- ✅ Enable Authorization Code and Credentials Flow
- ✅ OAuth Scopes: `full` and `refresh_token`
- ✅ Callback URL: `https://YOUR_HOST:YOUR_PORT/oauth/callback` (match your `.env` HOST and PORT)

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `node generate-certs.js` - Generate SSL certificates
