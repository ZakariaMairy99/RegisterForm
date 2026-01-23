# DaoRegisterForm - Multi-Step Supplier Registration Portal

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## 📋 Overview

**DaoRegisterForm** is an enterprise-grade multi-step supplier registration portal that streamlines the vendor onboarding process. It combines a modern React frontend with a robust Node.js/Express backend, featuring intelligent document analysis powered by AI and seamless Salesforce CRM integration.

### Key Features

✅ **Multi-Step Registration** - 5-step guided form with progress tracking  
✅ **AI-Powered Document Analysis** - Automatic data extraction using Google Gemini & Mindee OCR  
✅ **Salesforce Integration** - Direct data sync with OAuth 2.0 authentication  
✅ **Multi-Language Support** - English & French localization  
✅ **Secure File Uploads** - Support for PDF, images, Office documents with virus scanning  
✅ **Auto-Save** - localStorage-backed form state persistence  
✅ **Enterprise Security** - HTTPS, rate limiting, CORS protection, Helmet hardening  
✅ **Responsive Design** - Mobile-friendly UI with Tailwind CSS  

---

## 🏗️ Architecture

```
DaoRegisterForm/
├── DaoRegisterForm-backend/       # Node.js/Express API
│   ├── index.js                   # Main server entry point
│   ├── models.json                # Salesforce field mappings
│   └── certs/                     # SSL certificates
├── DaoRegisterForm-frontend/      # React + TypeScript SPA
│   ├── App.tsx                    # Main App component
│   ├── index.tsx                  # React entry point
│   ├── types.ts                   # TypeScript interfaces
│   ├── components/                # UI components
│   ├── hooks/                     # React hooks (useSupplierForm)
│   └── certs/                     # SSL certificates
└── package.json                   # Root package configuration
```

### Architecture Flow

```
Frontend (React + Vite)
        ↓
   HTTPS Layer
        ↓
Backend (Express API)
        ↓
    ┌───┴───────────────────┐
    ↓                       ↓
Salesforce        Google Gemini
(CRM/OAuth)       (Document AI)
    ↓                       ↓
jsforce           @google/generative-ai
    ↓                       ↓
Account Creation  Data Extraction
```

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js  
- **Framework**: Express.js (v5.1.0)  
- **Salesforce**: jsforce (v3.10.8) with OAuth 2.0  
- **AI/OCR**: Google Generative AI, Tesseract.js, Mindee  
- **File Processing**: Multer, Sharp, PDF.js, Canvas  
- **Security**: Helmet, express-rate-limit, CORS  
- **Development**: Nodemon  

### Frontend
- **Framework**: React (v19.2.0)  
- **Language**: TypeScript (5.8.2)  
- **Build Tool**: Vite (v6.2.0)  
- **Styling**: Tailwind CSS (via imported styles)  
- **i18n**: JSON-based translations  

### External Services
- **Salesforce** - CRM & Account Management  
- **Google Gemini 1.5 Flash** - AI Document Analysis  
- **Mindee API** - Structured Document Extraction  

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 14.0.0  
- **npm** or **yarn**  
- **Salesforce** Developer Account ([signup](https://developer.salesforce.com/signup))  
- **Google Gemini API Key** ([get here](https://makersuite.google.com/app/apikey))  
- **SSL Certificates** (auto-generated locally, required for development)  

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/DaoRegisterForm.git
cd DaoRegisterForm
```

#### 2. Backend Setup

```bash
cd DaoRegisterForm-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required Environment Variables:**
```env
SALESFORCE_CLIENT_ID=your_client_id
SALESFORCE_CLIENT_SECRET=your_client_secret
SALESFORCE_LOGIN_URL=https://login.salesforce.com
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
HOST=localhost
PUBLIC_URL=https://localhost:3001
ALLOWED_ORIGINS=http://localhost:5173
MAX_UPLOAD_BYTES=5242880
NODE_ENV=development
```

#### 3. Generate SSL Certificates (Local Development)

```bash
# From backend directory
node generate-certs.js
```

#### 4. Get Salesforce Refresh Token

```bash
# Interactive OAuth flow to retrieve refresh token
node get-refresh-token.js
```

Add the refresh token to your `.env`:
```env
SALESFORCE_REFRESH_TOKEN=your_refresh_token
```

#### 5. Start Backend

```bash
# Development with auto-reload
npm run dev

# Or production
npm start
```

Backend will be available at: `https://localhost:3001`

#### 6. Frontend Setup

```bash
cd ../DaoRegisterForm-frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=https://localhost:3001" > .env.local
```

#### 7. Start Frontend

```bash
npm run dev
```

Frontend will be available at: `https://localhost:5173`

---

## 📝 Usage

### Registration Flow

1. **Step 1: Organization Info** - Company name, registration number, address  
2. **Step 2: Contact Details** - Primary contact information  
3. **Step 3: Document Upload** - Upload business licenses, tax certificates, etc.  
4. **Step 4: Review** - Recap all entered information  
5. **Step 5: Confirmation** - Final submission to Salesforce  

### API Endpoints

#### Authentication
```
GET  /login                    # Initiate OAuth flow
GET  /oauth/callback          # OAuth callback handler
GET  /logout                  # Session logout
```

#### Form Operations
```
POST /api/suppliers           # Create supplier account
PUT  /api/suppliers/:id       # Update existing account
GET  /api/suppliers/:id       # Retrieve account details
```

#### Document Processing
```
POST /api/ocr/analyze         # Analyze document with AI
POST /api/files/upload        # Upload file to Salesforce
GET  /api/files/:id           # Retrieve file metadata
```

#### Health
```
GET  /health                  # Server status
```

### Example Request

```bash
curl -X POST https://localhost:3001/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "rcNumber": "123456789",
    "country": "CA",
    "contactEmail": "hello@acme.com"
  }'
```

---

## 🔐 Security Features

- **HTTPS Only** - All endpoints require secure connections  
- **Rate Limiting** - Prevents brute force attacks (configurable)  
- **CORS Protection** - Whitelist-based origin validation  
- **Helmet.js** - HTTP security headers (CSP, X-Frame-Options, etc.)  
- **Input Sanitization** - Prevents XSS and injection attacks  
- **Error Sanitization** - Hides sensitive Salesforce internals from clients  
- **File Validation** - Extension & MIME type verification  
- **OAuth 2.0** - Secure Salesforce authentication  

---

## 📦 Build & Deployment

### Build Frontend for Production

```bash
cd DaoRegisterForm-frontend
npm run build
# Output: dist/
```

### Build Backend

```bash
cd DaoRegisterForm-backend
# Ensure .env is configured for production
NODE_ENV=production npm start
```

### Docker Deployment (Optional)

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "index.js"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🧪 Testing

### Backend Tests

```bash
cd DaoRegisterForm-backend

# Test Gemini OCR
node test-gemini.js

# Test simple analysis
node test-gemini-simple.js
```

### Frontend Type Checking

```bash
cd DaoRegisterForm-frontend
npx tsc --noEmit
```

---

## 📚 Project Structure

### Backend Directory

```
DaoRegisterForm-backend/
├── index.js                 # Express server, routes, middleware
├── models.json              # Salesforce field mappings
├── generate-certs.js        # SSL certificate generator
├── get-refresh-token.js     # OAuth token retriever
├── test-gemini.js           # Gemini API tests
├── eng.traineddata          # Tesseract English model
├── fra.traineddata          # Tesseract French model
├── package.json
└── certs/                   # SSL certificates (generated)
    ├── localhost.key
    └── localhost.crt
```

### Frontend Directory

```
DaoRegisterForm-frontend/
├── App.tsx                  # Main App container
├── index.tsx                # React DOM entry
├── index.html               # HTML shell
├── types.ts                 # TypeScript interfaces
├── vite.config.ts           # Vite configuration
├── tsconfig.json
├── en.json                  # English translations
├── fr.json                  # French translations
├── metadata.json            # App metadata
├── components/
│   ├── Layout.tsx           # Main layout wrapper
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── Modal.tsx            # Reusable modal
│   ├── FormComponents.tsx   # Shared form inputs
│   ├── countries.ts         # Country list
│   └── steps/
│       ├── Step1Organization.tsx
│       ├── Step2Contact.tsx
│       ├── Step3Documents.tsx
│       ├── Step4Recap.tsx
│       └── Step5Confirmation.tsx
├── hooks/
│   └── useSupplierForm.ts   # Form state management
└── certs/                   # SSL certificates
```

---

## 🔗 Salesforce Integration

### OAuth 2.0 Flow

1. User clicks "Login" → redirects to Salesforce login  
2. User grants permission → redirected to `/oauth/callback`  
3. Backend exchanges code for access token  
4. Token stored in session (or refresh token in .env)  
5. Subsequent requests authenticated via jsforce  

### Salesforce Field Mappings

Custom API names used in Salesforce:
- `RC__c` - Registration/Company Number  
- `ICE__c` - ICE Number  
- `IBAN__c` - Bank IBAN  
- Other standard Account fields  

See [models.json](DaoRegisterForm-backend/models.json) for complete mappings.

---

## 📄 Document Processing

### Supported File Types

| Category | Extensions | Max Size |
|----------|-----------|----------|
| Documents | PDF, DOCX, DOC, XLS, XLSX, CSV, TXT | 5 MB |
| Images | JPG, JPEG, PNG, TIFF | 5 MB |

### OCR Processing Pipeline

1. **Upload** - File received via multipart/form-data  
2. **Validation** - MIME type & extension check  
3. **Storage** - Uploaded to Salesforce as ContentVersion  
4. **Analysis** - Sent to Google Gemini for extraction  
5. **Extraction** - Structured JSON returned  
6. **Linking** - ContentDocumentLink created to Account  

---

## 🌍 Internationalization (i18n)

Translations available for:
- **English** (`en.json`)  
- **French** (`fr.json`)  

Add new translations:
1. Add key/value pairs to `en.json` and `fr.json`  
2. Reference in components: `i18n[language].key`  

---

## 🐛 Troubleshooting

### CORS Errors
```
Solution: Ensure ALLOWED_ORIGINS in .env includes frontend URL
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### Salesforce Auth Fails
```
Solution: Verify CLIENT_ID, CLIENT_SECRET, and PUBLIC_URL are correct
Run: node get-refresh-token.js to get fresh token
```

### SSL Certificate Errors
```
Solution: Regenerate certificates
cd DaoRegisterForm-backend
rm -rf certs/
node generate-certs.js
```

### Document Upload Fails
```
Solution: Check file size, MIME type, and Salesforce API limits
Verify MAX_UPLOAD_BYTES and SALESFORCE_CLIENT limits
```

---

## 📈 Performance Optimization

- **Frontend**: Vite bundling, code splitting, lazy loading  
- **Backend**: Connection pooling, rate limiting, caching  
- **OCR**: Async processing, image optimization  
- **Salesforce**: Batch operations, field indexing  

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository  
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`  
3. **Commit** changes: `git commit -m 'Add amazing feature'`  
4. **Push** to branch: `git push origin feature/amazing-feature`  
5. **Open** a Pull Request  

### Code Standards

- Use **TypeScript** for type safety  
- Follow **ESLint** rules  
- Add **JSDoc comments** for functions  
- Write **meaningful commit messages**  
- Test before submitting PR  

---

## 📋 Roadmap

- [ ] Email notifications on submission  
- [ ] Two-factor authentication (2FA)  
- [ ] Advanced payment integration  
- [ ] Mobile app (React Native)  
- [ ] Real-time dashboard for admins  
- [ ] Webhook support for external systems  
- [ ] Advanced analytics & reporting  

---

## 📞 Support & Contact

For issues, questions, or feature requests:
- **Issues**: [GitHub Issues](https://github.com/your-org/DaoRegisterForm/issues)  
- **Email**: support@example.com  
- **Documentation**: [Wiki](https://github.com/your-org/DaoRegisterForm/wiki)  

---

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Salesforce** - CRM Platform  
- **Google Gemini** - AI Document Analysis  
- **Mindee** - Document Intelligence  
- **React Team** - UI Framework  
- **Node.js Community** - Server Runtime  

---

## 📊 Project Statistics

- **Backend**: ~1200 lines of JavaScript  
- **Frontend**: 5 form steps in React/TypeScript  
- **Documentation**: Inline comments & README  
- **Languages**: 2 (EN/FR)  
- **API Endpoints**: 10+  

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

---

<div align="center">

### Made with ❤️ for enterprise supplier management

[⬆ back to top](#daoregisterform---multi-step-supplier-registration-portal)

</div>
