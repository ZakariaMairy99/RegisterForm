const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
const path = require('path');
const jsforce = require('jsforce');
const mindee = require('mindee');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Tesseract = require('tesseract.js');
const { createCanvas } = require('@napi-rs/canvas');
const sharp = require('sharp');
require('dotenv').config();

const app = express();
const multer = require('multer');
// Server-side file size limit (bytes) configurable via env
const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || '5242880', 10); // 5 MB default
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// SSL Certificate (only for local development)
let httpsOptions = {};
if (process.env.NODE_ENV !== 'production') {
  try {
    httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.key')),
      cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.crt'))
    };
  } catch (e) {
    console.warn('⚠️ Certificates not found, HTTPS might fail locally.');
  }
}

// Salesforce OAuth 2.0 Configuration
const CLIENT_ID = process.env.SALESFORCE_CLIENT_ID;
const CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET;
const REDIRECT_URI = process.env.PUBLIC_URL 
  ? `${process.env.PUBLIC_URL}/oauth/callback` 
  : `https://${process.env.HOST}:${process.env.PORT}/oauth/callback`;

// Initialize jsforce connection
const conn = new jsforce.Connection({
  oauth2: {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com'
  }
});

// Server-side allowed file settings
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.tiff'];
const ALLOWED_MIME_PREFIXES = ['application/', 'image/', 'text/'];

// Helper: sanitize filename to a safe token
function sanitizeFilename(name) {
  if (!name) return 'file';
  let b = path.basename(name);
  b = b.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (b.length > 120) b = b.slice(0, 120);
  return b;
}

// Helper: sanitize messages before sending to clients
function sanitizeForClient(msg) {
  if (!msg) return 'Une erreur est survenue';
  let out = String(msg);
  // Friendly handling for duplicate messages
  if (/duplicate value/i.test(out) || /duplicate/i.test(out) || /duplicates value/i.test(out)) {
    return 'Doublon détecté : une valeur identique existe déjà.';
  }
  // Remove Salesforce 15/18 char IDs
  out = out.replace(/\b[0-9A-Za-z]{15,18}\b/g, '[id supprimé]');
  // Remove API field/object names like SomeField__c or Account.SomeField
  out = out.replace(/\b([A-Za-z0-9_]+)__(?:c|r)\b/g, (m, p1) => p1.replace(/_/g, ' '));
  out = out.replace(/\bAccount\.[A-Za-z0-9_]+\b/g, '[champ supprimé]');
  // Remove object API names (e.g., Account, Contact) from messages
  out = out.replace(/\b(Account|Contact|ContentVersion|ContentDocument|ContentDocumentLink|RecordType)\b/g, '[objet]');
  // Collapse whitespace
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

// Security middleware
app.disable('x-powered-by');
app.use(helmet());

// CORS: restrict to allowed origins (comma-separated env var) or allow local dev by default
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim());
// Log allowed origins at startup to help debug CORS issues
console.log('Allowed CORS origins:', allowedOrigins);
// Use dynamic origin function so we properly respond to preflight requests and can log blocked origins
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g., curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('Blocked CORS origin:', origin);
    // Do not throw an error here; return false so CORS middleware simply won't set the header.
    // Throwing an Error propagates to express error handlers and causes 500 logs.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
// Provide a safe, framework-agnostic preflight responder to avoid path-to-regexp issues
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // CORS middleware already set appropriate headers for allowed origins
    return res.sendStatus(204);
  }
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000), // 1 minute default
  max: Number(process.env.RATE_LIMIT_MAX || 60), // limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Body parsers with size limits
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'DaoRegisterForm Backend API',
    authenticated: !!conn.accessToken
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    authenticated: !!conn.accessToken
  });
});

// Return custom metadata logo URL (reads first record of the custom metadata type)
app.get('/api/metadata/logo', async (req, res) => {
  // Require authentication
  if (!conn.accessToken) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Please log in first.',
      loginUrl: `https://${HOST}:${PORT}/login`
    });
  }

  try {
    // Query the custom metadata type for the logo + name fields. Adjust the object name if yours differs.
    // Using SOQL to fetch Logo__c, GroupName__c and DeveloperName from the __mdt object.
    const q = await conn.query("SELECT Logo__c, GroupName__c, DeveloperName FROM MetaRegisterForm__mdt LIMIT 1");
    let logoUrl = null;
    let logoName = null;
    let developerName = null;
    if (q && q.records && q.records.length > 0) {
      const rec = q.records[0];
      logoUrl = rec.Logo__c || null;
      logoName = rec.GroupName__c || null;
      developerName = rec.DeveloperName || null;
    }
    return res.json({ success: true, logoUrl, logoName, developerName });
  } catch (err) {
    const safe = sanitizeForClient(err && err.message ? err.message : 'Failed to fetch metadata logo');
    return res.status(500).json({ success: false, error: safe });
  }
});

// Route to initiate Salesforce OAuth login
app.get('/login', (req, res) => {
  const authUrl = conn.oauth2.getAuthorizationUrl({ scope: 'full refresh_token' });
  res.redirect(authUrl);
});

// OAuth callback handler
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    const userInfo = await conn.authorize(code);
    res.send(`
      <html>
        <head><title>Salesforce Authentication Success</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #2e844a;">✅ Successfully logged in to Salesforce!</h1>
          <p>Authentification réussie. Vous pouvez fermer cette fenêtre et revenir à l'application.</p>
          <hr>
          <p>You can now close this window and submit the form.</p>
          <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #2e844a; color: white; text-decoration: none; border-radius: 5px;">Go to Home</a>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`
      <html>
        <head><title>OAuth Failed</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px;">
          <h1 style="color: #c23934;">❌ OAuth failed</h1>
          <p><strong>Error:</strong> ${sanitizeForClient(err && err.message ? err.message : '')}</p>
          <a href="/login">Try Again</a>
        </body>
      </html>
    `);
  }
});

// Create supplier endpoint - requires authentication
app.post('/api/supplier', upload.any(), async (req, res) => {
  // Check if authenticated
  if (!conn.accessToken) {
    return res.status(401).json({ 
      success: false,
      error: 'Not authenticated. Please log in first.',
      loginUrl: `https://${HOST}:${PORT}/login`
    });
  }

  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }

    // Validate required field: raisonSociale
    if (!req.body.raisonSociale || req.body.raisonSociale.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Raison sociale is required'
      });
    }

    // If multipart was used, multer populated req.body (strings) and req.files (buffers)
    console.log('Creating supplier in Salesforce:', req.body);

    // Normalize country value to Salesforce picklist API names
    let countryApiValue;
    if (req.body && req.body.country) {
      let c = String(req.body.country).trim();
      // Remove invisible characters but keep accents
      // This regex keeps standard ASCII, Latin-1 Supplement, and Latin Extended-A
      c = c.replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F]/g, '');
      
      countryApiValue = c;
      console.log(`🌍 Country normalization: "${req.body.country}" -> "${countryApiValue}"`);
    }

    // Map frontend data to Salesforce Account fields
    const accountData = {
      Name: req.body.raisonSociale,
      RecordTypeId: '012WS0000031KxRYAU',
      
      // Company Information
      Phone: req.body.phone,
      Website: req.body.website,
      
      // Address
      BillingStreet: req.body.address,
      BillingCity: req.body.city,
      BillingPostalCode: req.body.postalCode,
      BillingCountry: req.body.country,
      // Custom country field: save the selected country into Country__c (use API name expected by picklist)
      Country__c: countryApiValue,
      
      // Custom Fields (adjust field names to match your Salesforce schema)
      DBA__c: req.body.nomCommercial,
      RC__c: req.body.rc,
      LegalForm__c: req.body.formeJuridique,
      CommonCompanyIdentifier__c: req.body.ice,
      FiscalIdentifier__c: req.body.identifiantFiscal,
      Identifiant_fiscal_1__c: req.body.identifiantFiscal1,
      Identifiant_fiscal_2__c: req.body.identifiantFiscal2,
      Siret__c: req.body.siret,
      // Use VATNumber__c for TVA Intracommunautaire (France/Other) and VATNumberMaroc__c for Maroc if needed
      // Assuming req.body.tva holds the value for both cases from frontend
      VATNumber__c: req.body.tva,
      EmailPrincipale__c: req.body.emailEntreprise,
      DateCreation__c: req.body.dateCreation,
      SupplierType__c: req.body.typeEntreprise,
      Nombre_d_employes__c: req.body.effectifTotal,
      Effectif_Encadrement__c: req.body.effectifEncadrement,
      ExercicesClos__c: req.body.exercicesClos,
      // Certifications may come as an array (JSON) or as a joined string depending on client
      Certifications_generales__c: (function(c) {
        if (!c) return '';
        if (Array.isArray(c)) return c.join(', ');
        if (typeof c === 'string') {
          try { const parsed = JSON.parse(c); if (Array.isArray(parsed)) return parsed.join(', ') } catch (e) {}
          return c;
        }
        return '';
      })(req.body.certifications),
      // Convert hsePolicy (string coming from frontend like 'oui'/'non' or 'true'/'false') to boolean
      PolitiqueHSE__c: (function(val) {
        if (val === undefined || val === null || val === '') return undefined;
        const v = String(val).toLowerCase().trim();
        if (v === 'oui' || v === 'true' || v === 'yes' || v === '1') return true;
        if (v === 'non' || v === 'false' || v === 'no' || v === '0') return false;
        // If it's already a boolean
        if (typeof val === 'boolean') return val;
        // Fallback: don't include the field to avoid deserialization errors
        return undefined;
      })(req.body.hsePolicy)
    };

    // Contact Information - REQUIRED fields
    const contactData = {
      FirstName: req.body.contactPrenom,
      LastName: req.body.contactNom,
      Email: req.body.email,
      Salutation: req.body.civility,
      Phone: req.body.contactMobile,
      OtherPhone: req.body.otherPhone,
      PreferredLanguage__c: req.body.language, 
      Timezone__c: req.body.timezone
    };

    // Validate Contact required fields BEFORE creating Account
    if (!contactData.FirstName || contactData.FirstName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Prénom du contact is required'
      });
    }
    if (!contactData.LastName || contactData.LastName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Nom du contact is required'
      });
    }
    if (!contactData.Email || contactData.Email.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Email principal is required'
      });
    }

    // Remove undefined/null/empty fields from Account
    Object.keys(accountData).forEach(key => {
      if (accountData[key] === undefined || accountData[key] === null || accountData[key] === '') {
        delete accountData[key];
      }
    });

    Object.keys(contactData).forEach(key => {
      if (contactData[key] === undefined || contactData[key] === null || contactData[key] === '') {
        delete contactData[key];
      }
    });

    // Determine Record Type based on Country
    // Maroc -> LocalSupplier
    // Other -> ForeignSupplier
    // Frontend sends 'MA' for Maroc, so we check for both 'maroc' and 'ma'
    const isLocal = countryApiValue && (countryApiValue.toLowerCase() === 'maroc' || countryApiValue.toLowerCase() === 'ma');
    const targetRtDevName = isLocal ? 'LocalSupplier' : 'ForeignSupplier';
    console.log(`🌍 Country is "${countryApiValue}", selecting RecordType: ${targetRtDevName}`);

    let recordTypeId = null;
    try {
      const rtQuery = await conn.query(
        `SELECT Id FROM RecordType WHERE SObjectType='Account' AND DeveloperName='${targetRtDevName}' LIMIT 1`
      );
      if (rtQuery && rtQuery.records && rtQuery.records.length > 0) {
        recordTypeId = rtQuery.records[0].Id;
        console.log(`✅ Found RecordType "${targetRtDevName}":`, recordTypeId);
      } else {
        console.warn(`⚠️ RecordType "${targetRtDevName}" not found.`);
      }
    } catch (rtErr) {
      console.warn('⚠️ Could not query RecordType:', rtErr && rtErr.message);
    }

    // Add RecordTypeId to accountData if found
    if (recordTypeId) {
      accountData.RecordTypeId = recordTypeId;
    }

    console.log('📤 Creating Account in Salesforce:', JSON.stringify(accountData, null, 2));
    // Log types for debugging potential deserialization issues
    const accountTypes = {};
    Object.keys(accountData).forEach(k => { accountTypes[k] = typeof accountData[k]; });
    console.log('🔎 Account payload types:', JSON.stringify(accountTypes, null, 2));

    // Create Account using standard Salesforce API
    let accountResult;
    try {
      accountResult = await conn.sobject('Account').create(accountData);
    } catch (sfErr) {
      console.error('❌ Salesforce create Account error (raw):', sfErr);
      if (sfErr && sfErr.body) {
        console.error('❌ Salesforce error body:', JSON.stringify(sfErr.body, null, 2));
      }

      // Detect duplicate-value errors and return structured field info (without exposing IDs/API names)
      try {
        const body = sfErr.body;
        // jsforce sometimes returns an array of error objects
        const errs = Array.isArray(body) ? body : (body && body.output && body.output.errors ? body.output.errors : (body && body[0] ? body : [body]));
        const dupDetails = [];
        const FIELD_MAP = {
          // API name (lowercase) -> { key: formFieldKey, label: friendly label }
          'nomfournisseur__c': { key: 'raisonSociale', label: 'Nom fournisseur' },
          'name': { key: 'raisonSociale', label: 'Raison sociale' },
          'dba__c': { key: 'nomCommercial', label: 'Nom commercial' }
        };

        const tryExtract = (msg) => {
          if (!msg) return null;
          // message like: "duplicate value found: NomFournisseur__c duplicates value on record with id: 001..."
          const m = String(msg).match(/duplicate value found:\s*([A-Za-z0-9_]+(?:__c|__r)?)/i);
          if (m && m[1]) return m[1];
          return null;
        };

        if (errs && errs.length) {
          for (const e of errs) {
            const msg = e && e.message ? e.message : (typeof e === 'string' ? e : null);
            const api = tryExtract(msg);
            if (api) {
              const apiKey = api.toLowerCase();
              const map = FIELD_MAP[apiKey] || null;
              dupDetails.push({ apiName: api, fieldKey: map ? map.key : null, label: map ? map.label : api, message: 'Valeur dupliquée' });
            }
          }
        }

        if (dupDetails.length > 0) {
          // Return a 409 Conflict with structured info; don't leak IDs or raw api names beyond a friendly label
          const clientDetails = dupDetails.map(d => ({ field: d.fieldKey || null, label: d.label, message: d.message }));
          return res.status(409).json({ success: false, error: 'Doublon détecté : une valeur existe déjà.', duplicates: clientDetails });
        }
      } catch (parseErr) {
        console.warn('Could not parse Salesforce error for duplicates', parseErr);
      }

      // If not handled above, rethrow to be caught by outer handler which sanitizes
      throw sfErr;
    }

    if (!accountResult.success) {
      throw new Error('Failed to create Account: ' + JSON.stringify(accountResult.errors));
    }

    console.log('✅ Account created:', accountResult.id);

    // Always create a NEW Contact and link it to the Account (do NOT search for existing Contacts by email)
    contactData.AccountId = accountResult.id;
    let contactResult = { id: null, success: false };
    try {
      console.log('📤 Creating NEW Contact in Salesforce with AccountId:', accountResult.id);
      console.log('Contact data:', JSON.stringify(contactData, null, 2));
      // Use DuplicateRuleHeader to allow creation even if deduplication rules would normally block it
      const cr = await conn.sobject('Contact').create(contactData, { headers: { 'Sforce-Duplicate-Rule-Header': 'allowSave=true' } });
      contactResult = cr;
      if (cr && cr.success) {
        console.log('✅ Contact created:', cr.id);
      } else {
        console.error('❌ Contact creation returned without success:', cr && cr.errors ? JSON.stringify(cr.errors) : cr);
        throw new Error('Contact creation failed: ' + JSON.stringify(cr));
      }
    } catch (crErr) {
      console.error('❌ Error creating Contact:', crErr && crErr.message ? crErr.message : crErr);
      if (crErr && crErr.body) {
        console.error('Contact error body:', JSON.stringify(crErr.body, null, 2));
      }
      // Continue; the Account has been created successfully even if Contact creation failed
      // But capture the error message for the warning
    }

    console.log('✅ Supplier created successfully!');

    // Update Account with Contact__c reference if contact was successfully created/linked
    if (contactResult.id) {
      try {
        await conn.sobject('Account').update({
          Id: accountResult.id,
          Contact__c: contactResult.id
        });
        console.log('✅ Account updated with Contact__c reference:', contactResult.id);
      } catch (updateErr) {
        console.warn('⚠️ Could not update Account.Contact__c field. Field may not exist in Salesforce schema:', updateErr && updateErr.message);
      }
    }

    // Create AttestationDeregularite__c record if OCR data was provided
    let attestationResult = { id: null, success: false };
    if (req.body.attestationRegulariteFiscaleData) {
      try {
        let ocrData = req.body.attestationRegulariteFiscaleData;
        // Parse if it's a JSON string
        if (typeof ocrData === 'string') {
          ocrData = JSON.parse(ocrData);
        }
        
        console.log('📄 Creating AttestationDeregularite__c with OCR data:', ocrData);
        
        // Helper function to convert date from DD-MM-YYYY to YYYY-MM-DD format
        const convertDateFormat = (dateStr) => {
          if (!dateStr) return null;
          // If already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
          }
          // Convert from DD-MM-YYYY to YYYY-MM-DD
          const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
          if (match) {
            return `${match[3]}-${match[2]}-${match[1]}`;
          }
          // Return null if format is not recognized
          console.warn('⚠️ Unrecognized date format:', dateStr);
          return null;
        };
        
        // Map Mindee fields to Salesforce fields
        const attestationData = {
          Fournisseur__c: accountResult.id, // Link to the Account
          NumeroAttestation__c: ocrData.numero_attestation || null,
          NumeroDidentificationFiscale__c: ocrData.numero_d_identification_fiscale || null,
          IdentifiantCommunEntreprise__c: ocrData.ice || null,
          NumeroRegistreCommerce__c: ocrData.registre_de_commerce || null,
          NumeroDidentificationTaxePro__c: ocrData.taxe_professionnelle ? String(ocrData.taxe_professionnelle) : null,
          DateDebut__c: convertDateFormat(ocrData.date_reception),
          DateEdition__c: convertDateFormat(ocrData.date_edition),
          EstEnRegularite__c: ocrData.statut_regularite === true || ocrData.statut_regularite === 'true',
          AConstiteDesGarantiesSuffisante__c: ocrData.statut_garanties === true || ocrData.statut_garanties === 'true',
          NestPasEnRegle__c: ocrData.nest_pas_en_regle === true || ocrData.nest_pas_en_regle === 'true'
        };
        
        // Remove null/undefined fields
        Object.keys(attestationData).forEach(key => {
          if (attestationData[key] === undefined || attestationData[key] === null || attestationData[key] === '') {
            delete attestationData[key];
          }
        });
        
        // Keep the Fournisseur__c field even if cleaning
        attestationData.Fournisseur__c = accountResult.id;
        
        console.log('📤 AttestationDeregularite__c data to create:', JSON.stringify(attestationData, null, 2));
        
        attestationResult = await conn.sobject('AttestationDeregularite__c').create(attestationData);
        
        if (attestationResult.success) {
          console.log('✅ AttestationDeregularite__c created:', attestationResult.id);
        } else {
          console.error('❌ AttestationDeregularite__c creation failed:', attestationResult.errors);
        }
      } catch (attErr) {
        console.error('❌ Error creating AttestationDeregularite__c:', attErr && attErr.message ? attErr.message : attErr);
        if (attErr && attErr.body) {
          console.error('Attestation error body:', JSON.stringify(attErr.body, null, 2));
        }
        // Don't fail the whole request, just log the error
      }
    }

    // If there are files uploaded via multipart, validate and attach them to the Account via ContentVersion + ContentDocumentLink
    try {
      const files = req.files || [];
      // Server-side validation: max files
      if (files.length > 20) {
        return res.status(400).json({ success: false, error: 'Too many files uploaded (max 20)' });
      }
      const uploadedFiles = [];
      if (files.length > 0) {
        console.log(`📎 Uploading ${files.length} files to ContentVersion`);
        for (const file of files) {
          try {
            // Basic validation per-file
            if (!file || !file.originalname) {
              console.warn('Skipping invalid file entry');
              continue;
            }

            // Fix encoding issue: if the filename was sent as UTF-8 but interpreted as Latin-1 (e.g. "é" -> "Ã©")
            let originalName = file.originalname;
            try {
              // This is a common fix for multer/busboy filename encoding issues
              const decodedName = Buffer.from(originalName, 'binary').toString('utf8');
              if (decodedName !== originalName) {
                originalName = decodedName;
              }
            } catch (e) {
              // fallback to original if decoding fails
            }

            if (file.size > MAX_UPLOAD_BYTES) {
              console.warn('File too large (server-side):', originalName);
              return res.status(400).json({ success: false, error: 'Un des fichiers dépasse la taille maximale autorisée.' });
            }
            const ext = path.extname(originalName).toLowerCase();
            const mime = (file.mimetype || '').toLowerCase();
            const extAllowed = ALLOWED_EXTENSIONS.includes(ext);
            const mimeOk = ALLOWED_MIME_PREFIXES.some(p => mime.startsWith(p));
            if (!extAllowed && !mimeOk) {
              console.warn('Disallowed file type (server-side):', originalName, mime);
              return res.status(400).json({ success: false, error: 'Type de fichier non autorisé.' });
            }
            if (/\.(exe|sh|bat|cmd|js|jar|msi)$/i.test(ext)) {
              console.warn('Executable file rejected (server-side):', originalName);
              return res.status(400).json({ success: false, error: 'Type de fichier dangereux non autorisé.' });
            }

            const base64 = file.buffer.toString('base64');
            const baseName = path.basename(originalName, ext) || 'FILE';
            
            // Use the baseName as the title directly, trimming whitespace.
            // The frontend sends the correct filename (e.g. "Attestation d'assurance (AT).pdf").
            // We do NOT strip parentheses or accents anymore, as requested.
            const title = baseName.trim();
            
            // Determine the restart location (ParentId)
            // Default to Account
            let firstPublishLocationId = accountResult.id;
            let secondaryLinkEntityId = null;

            // Check if this is the Attestation file and if we have an Attestation record
            const isAttestationFile = title && (
              title.includes('Attestation de Régularité Fiscale') || 
              title.includes('Attestation de Regularite Fiscale') ||
              (title.includes('Attestation') && title.includes('Fiscale') && title.includes('R'))
            );

            if (isAttestationFile && attestationResult && attestationResult.id) {
               console.log('🎯 Detected Attestation file. Setting FirstPublishLocationId to Attestation record:', attestationResult.id);
               firstPublishLocationId = attestationResult.id;
               secondaryLinkEntityId = accountResult.id;
            }

            // Include extension in PathOnClient so Salesforce has the filename with extension
            const pathOnClient = `${title}${ext}`;
            console.log('Uploading file to ContentVersion - Title:', title, 'PathOnClient:', pathOnClient, 'MIME:', file.mimetype);

            const cv = {
              Title: title,
              PathOnClient: pathOnClient,
              VersionData: base64,
              FirstPublishLocationId: firstPublishLocationId
            };

            const cvRes = await conn.sobject('ContentVersion').create(cv);
            console.log('📤 ContentVersion created id=', cvRes.id, 'for file:', pathOnClient);
            
            // Query to get ContentDocumentId
            const q = await conn.query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id='${cvRes.id}'`);
            const contentDocumentId = q.records && q.records[0] && q.records[0].ContentDocumentId;
            
            if (contentDocumentId) {
              // If we have a secondary entity to link to (e.g. we published to Attestation, now link to Account)
              // OR if we published to Account (default) and just want to ensure it's linked there (implicit in FirstPublishLocationId but safer to check logic)
              
              // Only create explicit link if secondaryLinkEntityId is defined (meaning we published to Attestation)
              // OR if we published to Account (default), we don't need to link to Account again.
              
              if (secondaryLinkEntityId) {
                  try {
                    await conn.sobject('ContentDocumentLink').create({
                      ContentDocumentId: contentDocumentId,
                      LinkedEntityId: secondaryLinkEntityId,
                      ShareType: 'V',
                      Visibility: 'AllUsers'
                    });
                    console.log('🔗 Linked ContentDocument to Secondary Entity (Account):', contentDocumentId, '->', secondaryLinkEntityId);
                  } catch (linkErr) {
                    console.warn('⚠️ Standard ContentDocumentLink create warning:', linkErr && linkErr.message ? linkErr.message : linkErr);
                  }
              } else {
                 // We published to Account. If we were trying to link to Attestation in the old logic, we don't need that anymore 
                 // because the new logic handles Attestation as PRIMARY if detected.
                 
                 // However, for NON-Attestation files, we just ensure the default link is created via FirstPublishLocationId.
                 // Salesforce auto-creates a link to FirstPublishLocationId, so no manual link needed for that one.
                 
                 // Just strictly explicitly link to Account if for some reason FirstPublishLocationId didn't do it (rare but possible with library workspaces)
                 // But typically FirstPublishLocationId is enough.
                 
                 // We keep the logic simple: We uploaded to firstPublishLocationId. Done.
                 uploadedFiles.push({ fileName: pathOnClient, contentDocumentId });
              }
            } else {
              console.warn('⚠️ Could not determine ContentDocumentId for ContentVersion', cvRes.id);
            }
          } catch (fErr) {
            console.error('❌ Error uploading file to ContentVersion:', fErr);
          }
        }
      }
      // Attach uploaded file details to response data
      if (uploadedFiles.length > 0) {
        res.locals.uploadedFiles = uploadedFiles;
      }
    } catch (attachErr) {
      console.error('❌ Error attaching files to Account:', attachErr);
    }

    // Successful response with uploaded file info if any
    console.log('📋 Final result - Account:', accountResult.id, 'Contact:', contactResult.id || 'none');
    
    const responseData = {
      success: true,
      message: 'Supplier created successfully',
      data: {
        accountId: accountResult.id,
        contactId: contactResult.id || null,
        contactLinked: !!contactResult.id,
        attestationId: attestationResult.id || null,
        uploadedFiles: res.locals.uploadedFiles || []
      },
      warnings: []
    };

    // Add warnings if contact wasn't created/linked
    if (!contactResult.id) {
      responseData.warnings.push('Contact could not be created or linked. The account was created successfully, but you may need to manually create or link the contact in Salesforce.');
    }
    
    // Add warning if attestation wasn't created
    if (req.body.attestationRegulariteFiscaleData && !attestationResult.id) {
      responseData.warnings.push('L\'attestation de régularité fiscale n\'a pas pu être créée. Les données OCR ont été reçues mais la création dans Salesforce a échoué.');
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error('❌ Error creating supplier:', error);

    // Build a more descriptive error for the frontend when Salesforce returns structured errors
    // Sanitize error messages to avoid leaking internal IDs or API names to the frontend
    const sanitizeMessage = (msg) => {
      if (!msg) return 'Erreur lors de la création du fournisseur';
      // If Salesforce reports a duplicate value, show a friendly message and do NOT include IDs or API names
      if (/duplicate value/i.test(msg)) {
        return 'Doublon détecté : un enregistrement avec cette valeur existe déjà. Veuillez vérifier le nom du fournisseur et réessayer.';
      }
      
      // Handle common Salesforce validation errors
      if (/REQUIRED_FIELD_MISSING/i.test(msg)) {
        return 'Des champs obligatoires sont manquants : ' + msg.replace(/.*REQUIRED_FIELD_MISSING: /i, '').replace(/[:\[\]]/g, ' ').trim();
      }
      if (/INVALID_EMAIL_ADDRESS/i.test(msg)) {
        return 'Adresse email invalide : ' + msg.replace(/.*INVALID_EMAIL_ADDRESS: /i, '').trim();
      }
      if (/FIELD_CUSTOM_VALIDATION_EXCEPTION/i.test(msg)) {
        return 'Erreur de validation : ' + msg.replace(/.*FIELD_CUSTOM_VALIDATION_EXCEPTION: /i, '').trim();
      }
      if (/INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST/i.test(msg)) {
        return 'Valeur invalide pour un champ de liste : ' + msg.replace(/.*INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST: /i, '').trim();
      }

      // Remove Salesforce record Ids (15 or 18 character alphanumeric)
      msg = msg.replace(/\b[0-9A-Za-z]{15,18}\b/g, '');
      // Replace API field names like SomeField__c or SomeField__r with a human-friendly label (remove __c/__r and underscores)
      msg = msg.replace(/\b([A-Za-z0-9_]+)__(?:c|r)\b/g, (m, p1) => {
        const human = p1.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        return human;
      });
      // Collapse excessive whitespace
      msg = msg.replace(/\s+/g, ' ').trim();
      return msg;
    };

    let detailed = (error && error.message) ? String(error.message) : 'Erreur lors de la création du fournisseur';
    let statusCode = 500;

    try {
      if (error && error.body) {
        // jsforce may put details in error.body (object or array)
        if (Array.isArray(error.body) && error.body.length > 0) {
             // Join multiple errors
             detailed = error.body.map(e => e.message).join('; ');
             // If any error is a validation error, set status to 400
             if (error.body.some(e => ['REQUIRED_FIELD_MISSING', 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'INVALID_EMAIL_ADDRESS', 'INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST'].includes(e.errorCode))) {
                 statusCode = 400;
             }
        } else if (typeof error.body === 'string') {
            detailed = error.body;
        } else {
            detailed = JSON.stringify(error.body);
        }
      }
    } catch (e) {
      // ignore JSON errors
    }

    // Heuristic to detect validation errors in the message string if not caught by body inspection
    if (statusCode === 500 && /REQUIRED_FIELD_MISSING|FIELD_CUSTOM_VALIDATION_EXCEPTION|INVALID_EMAIL_ADDRESS|INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST|STRING_TOO_LONG/i.test(detailed)) {
        statusCode = 400;
    }

    const safe = sanitizeMessage(detailed);

    res.status(statusCode).json({
      success: false,
      error: safe
    });
  }
});

// Tesseract OCR Route - Optimized for Render with PDF Support
app.post('/api/ocr/analyze-tesseract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('🔍 Starting Optimized Tesseract OCR analysis...');
    console.log('File type:', req.file.mimetype);
    
    let imageBuffer = req.file.buffer;

    // Si c'est un PDF, convertir la première page en image
    if (req.file.mimetype === 'application/pdf') {
      try {
        console.log('📄 PDF detected - Converting to image...');
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        
        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(req.file.buffer),
          disableFontFace: true,
          isEvalSupported: false
        });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // Première page seulement
        
        const viewport = page.getViewport({ scale: 3.0 }); // Haute résolution (améliore la lisibilité)
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        imageBuffer = canvas.toBuffer('image/png');
        // Prétraitement image pour OCR (grayscale + normalize + threshold + resize)
        imageBuffer = await sharp(imageBuffer)
          .resize(1800) // largeur cible pour lisibilité
          .greyscale()
          .normalize()
          .threshold(160)
          .toBuffer();
        console.log('✅ PDF converted & preprocessed to PNG');
      } catch (pdfError) {
        console.error('PDF Conversion Error:', pdfError);
        return res.status(500).json({ 
          error: 'Erreur lors de la conversion du PDF. Essayez Gemini AI.' 
        });
      }
    }
    
    // Timeout de sécurité (25 secondes)
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OCR timeout - document trop complexe')), 25000)
    );

    // Configuration optimisée pour Render (rapide + faible mémoire)
    const ocrPromise = Tesseract.recognize(
      imageBuffer,
      'fra+eng', // French primary + English fallback
      {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`Progress: ${Math.round(info.progress * 100)}%`);
          }
        },
        // Paramètres optimisés pour performance
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT,
        // Inclure xXvV et crochets pour détecter les cases cochées; conserver les espaces
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789éèêëàâäùûüôöîïç °/-:.,|[]xXvV',
        preserve_interword_spaces: '1'
      }
    );

    const { data: { text } } = await Promise.race([ocrPromise, timeout]);

    console.log('--- TEXTE EXTRAIT TESSERACT ---');
    console.log(text);
    console.log('--------------------------------');

    // Helpers
    const stripDiacritics = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanDigits = s => (s || '').replace(/[^0-9]/g, '');
    
    const linesRaw = text.split(/\r?\n/);
    const lines = linesRaw.map(l => l.trim()).filter(Boolean);
    const normLines = lines.map(l => stripDiacritics(l.toLowerCase()));

    // Only return the fields required by Salesforce mapping
    const results = {
      numero_attestation: "",
      numero_d_identification_fiscale: "",
      ice: "",
      registre_de_commerce: "",
      taxe_professionnelle: "",
      date_reception: "",
      date_edition: "",
      statut_regularite: false,
      statut_garanties: false,
      nest_pas_en_regle: false
    };

    // 1. ICE (15 chiffres) - prefer contextual lines
    let iceMatch = null;
    for (let i = 0; i < normLines.length; i++) {
      if (normLines[i].includes('ice')) {
        const digits = cleanDigits(lines[i]);
        if (digits.length >= 15) {
          // take first 15-digit sequence
          const m = digits.match(/\d{15}/);
          if (m) { iceMatch = m[0]; break; }
        }
      }
    }
    if (!iceMatch) {
      const m = text.match(/ICE[\s:\-]*([0-9\s]{10,})/i);
      if (m) {
        const digits = cleanDigits(m[1]);
        const seq = digits.match(/\d{15}/);
        if (seq) iceMatch = seq[0];
      }
    }
    if (!iceMatch) {
      const any15 = text.match(/\b\d{15}\b/);
      if (any15) iceMatch = any15[0];
    }
    if (iceMatch) results.ice = iceMatch;

    // 2. RC
    let rcMatch = null;
    for (let i = 0; i < normLines.length; i++) {
      if (normLines[i].includes('registre de commerce') || normLines[i].includes('r.c')) {
        const digits = cleanDigits(lines[i]);
        const m = digits.match(/\d{3,10}/);
        if (m) { rcMatch = m[0]; break; }
      }
    }
    if (!rcMatch) {
      const m = text.match(/registre\s*de\s*commerce\D*(\d{3,10})/i) || text.match(/R\.?C\D*(\d{3,10})/i);
      if (m) rcMatch = m[1];
    }
    if (rcMatch) results.registre_de_commerce = rcMatch;

    // 3. IF (Identifiant Fiscal)
    let ifMatch = null;
    for (let i = 0; i < normLines.length; i++) {
      if (normLines[i].includes('identification fiscale') || normLines[i].includes('i.f')) {
        const digits = cleanDigits(lines[i]);
        const m = digits.match(/\d{6,12}/);
        if (m) { ifMatch = m[0]; break; }
      }
    }
    if (!ifMatch) {
      const m = text.match(/identification\s*fiscale\D*(\d{6,12})/i) || text.match(/I\.?F\D*(\d{6,12})/i);
      if (m) ifMatch = m[1];
    }
    if (ifMatch) results.numero_d_identification_fiscale = ifMatch;

    // 4. Taxe Pro
    let tpMatch = null;
    for (let i = 0; i < normLines.length; i++) {
      if (normLines[i].includes('taxe professionnelle') || normLines[i].includes('t.p')) {
        const digits = cleanDigits(lines[i]);
        const m = digits.match(/\d{5,12}/);
        if (m) { tpMatch = m[0]; break; }
      }
    }
    if (!tpMatch) {
      const m = text.match(/Taxe\s*Professionnelle\D*(\d{5,12})/i) || text.match(/T\.?P\D*(\d{5,12})/i);
      if (m) tpMatch = m[1];
    }
    if (tpMatch) results.taxe_professionnelle = tpMatch;

    // 5. Numéro Attestation (pipe-separated or labeled) - avoid OCR '/' confusion turning into '1'
    let attMatch = null;
    for (let i = 0; i < normLines.length; i++) {
      if (normLines[i].includes('attestation') || normLines[i].includes('numero') || normLines[i].includes('n°')) {
        const m = lines[i].match(/([0-9]{2,}(?:\|[0-9]+)+)/);
        if (m) { attMatch = m[1]; break; }
      }
    }
    if (!attMatch) {
      const m = text.match(/\b(?:N[°o]|No|Numéro)\s*[:\-]?\s*([0-9]{2,}(?:\|[0-9]+)+)/i) 
                || text.match(/N°\s*([\d|]+)/i) 
                || text.match(/attestation\s*[n°]*\s*([\d|]+)/i);
      if (m) attMatch = m[1];
    }
    if (attMatch && !/1\//.test(attMatch)) {
      results.numero_attestation = attMatch;
    }

    // 6. Dates (context-aware)
    const datePattern = /(\d{2})[-\/.](\d{2})[-\/.](\d{4})/;
    let dateReception = null;
    let dateEdition = null;
    for (let i = 0; i < normLines.length; i++) {
      const m = lines[i].match(datePattern);
      if (!m) continue;
      const d = `${m[3]}-${m[2]}-${m[1]}`;
      const L = normLines[i];
      if (L.includes('date de reception') || L.includes('reception')) {
        dateReception = d;
      } else if (L.includes('date d edition') || L.includes('edition')) {
        dateEdition = d;
      }
    }
    // Fallback: first two dates in document
    if (!dateReception || !dateEdition) {
      const allDates = text.match(/\d{2}[-\/.]\d{2}[-\/.]\d{4}/g);
      if (allDates && allDates.length >= 1 && !dateReception) {
        const m = allDates[0].match(datePattern);
        dateReception = `${m[3]}-${m[2]}-${m[1]}`;
      }
      if (allDates && allDates.length >= 2 && !dateEdition) {
        const m = allDates[1].match(datePattern);
        dateEdition = `${m[3]}-${m[2]}-${m[1]}`;
      }
    }
    if (dateReception) results.date_reception = dateReception.replace(/[/.]/g, '-');
    if (dateEdition) results.date_edition = dateEdition.replace(/[/.]/g, '-');

    // 7. Statut régularité / garanties / non-conformité via checkboxes or explicit phrases
    const checkboxMarkers = ['x', 'v', '[x]', '[v]', '✓', '☑'];
    const hasMarker = (line) => checkboxMarkers.some(m => line.toLowerCase().includes(m));

    for (let i = 0; i < linesRaw.length; i++) {
      const raw = linesRaw[i].trim();
      const lower = raw.toLowerCase();
      // En règle
      if (lower.includes('en regle') || lower.includes('réguliere') || lower.includes('reguliere')) {
        if (hasMarker(lower)) results.statut_regularite = true;
      }
      // Garanties suffisantes
      if (lower.includes('garanties suffis') || lower.includes('constitue des garanties')) {
        if (hasMarker(lower)) results.statut_garanties = true;
      }
      // N'est pas en règle (checkbox line)
      if (lower.includes("n'est pas en regle") || lower.includes('nest pas en regle')) {
        if (hasMarker(lower)) results.nest_pas_en_regle = true;
      }
    }

    // Fallback on phrases if checkboxes not detected
    if (!results.statut_regularite && (/situation\s*fiscale\s*r[ée]guli[èe]re/i.test(text) || /en\s*r[èe]gle/i.test(text))) {
      results.statut_regularite = true;
    }
    if (!results.statut_garanties && (/garanti?es?\s*suffisantes?/i.test(text) || /constitu[ée]\s*des\s*garanties/i.test(text))) {
      results.statut_garanties = true;
    }
    if (!results.nest_pas_en_regle && (/n['’]est\s*pas\s*en\s*r[èe]gle/i.test(text) || /non\s*r[èe]gulier/i.test(text))) {
      results.nest_pas_en_regle = true;
    }

    console.log('✅ Tesseract OCR Results:', results);
    res.json(results);

  } catch (error) {
    console.error('Tesseract Error:', error);
    if (error.message.includes('timeout')) {
      return res.status(408).json({ 
        error: 'Délai dépassé. Le document est trop complexe. Réessayez avec un fichier plus léger.' 
      });
    }
    res.status(500).json({ error: 'Erreur lors de l\'analyse OCR: ' + error.message });
  }
});

// Gemini OCR Route
app.post('/api/ocr/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing');
      return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    // Try models in order of preference and availability
    const modelsToTry = [
      process.env.GEMINI_MODEL,
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-2.0-flash-exp"
    ].filter(Boolean);
    
    let model = null;
    for (const modelName of modelsToTry) {
      try {
        console.log(`[OCR] Tentative avec modèle: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`[OCR] Modèle sélectionné: ${modelName}`);
        break;
      } catch (e) {
        console.warn(`[OCR] Modèle ${modelName} indisponible, essai suivant...`);
      }
    }
    
    if (!model) {
      return res.status(500).json({ error: 'Aucun modèle Gemini disponible. Vérifiez votre quota API.' });
    }

    // Prepare image data
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      },
    };

    const prompt = `
      Analyse ce document (Attestation de Régularité Fiscale Marocaine) et extrais les informations suivantes au format JSON uniquement.
      Ne mets pas de markdown (pas de \`\`\`json). Renvoie juste l'objet JSON brut.

      Champs à extraire :
      - numero_attestation (String)
      - numero_d_identification_fiscale (String)
      - ice (String)
      - registre_de_commerce (String)
      - taxe_professionnelle (String)
      - date_reception (String, format DD-MM-YYYY)
      - date_edition (String, format DD-MM-YYYY)
      - statut_regularite (Boolean, true si le contribuable est en situation fiscale régulière)
      - statut_garanties (Boolean, true si le contribuable a constitué des garanties suffisantes)
      - nest_pas_en_regle (Boolean, true si le contribuable n'est pas en règle)

      Si un champ n'est pas trouvé, mets null.
    `;

    console.log('🤖 Sending request to Gemini...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();
    
    console.log('Gemini Raw Response:', text);

    // Clean up markdown if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let jsonResult = {};
    try {
      jsonResult = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini JSON:', e);
      return res.status(500).json({ error: 'Erreur lors de l\'analyse du document (Format invalide)' });
    }

    // Whitelist only the allowed fields
    const allowedKeys = [
      'numero_attestation',
      'numero_d_identification_fiscale',
      'ice',
      'registre_de_commerce',
      'taxe_professionnelle',
      'date_reception',
      'date_edition',
      'statut_regularite',
      'statut_garanties',
      'nest_pas_en_regle'
    ];
    const filtered = {};
    allowedKeys.forEach(k => {
      if (Object.prototype.hasOwnProperty.call(jsonResult, k)) {
        filtered[k] = jsonResult[k];
      }
    });

    console.log('Formatted result (filtered):', filtered);
    res.json(filtered);

  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse OCR: ' + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start Server (HTTP in production, HTTPS in dev)
if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
  });
} else {
  https.createServer(httpsOptions, app).listen(PORT, HOST, () => {
    console.log(`\n🚀 HTTPS Server is running on https://${HOST}:${PORT}`);
    console.log(`\n📋 OAuth Flow:`);
    console.log(`   Login: https://${HOST}:${PORT}/login`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`   POST https://${HOST}:${PORT}/api/supplier`);
    console.log(`\n⚠️  Note: Login first at /login before submitting forms!`);
  });
}

module.exports = app;
