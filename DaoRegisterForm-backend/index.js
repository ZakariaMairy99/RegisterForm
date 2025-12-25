const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
const path = require('path');
const jsforce = require('jsforce');
require('dotenv').config();

const app = express();
const multer = require('multer');
// Server-side file size limit (bytes) configurable via env
const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || '5242880', 10); // 5 MB default
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// SSL Certificate
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.crt'))
};

// Salesforce OAuth 2.0 Configuration
const CLIENT_ID = process.env.SALESFORCE_CLIENT_ID;
const CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET;
const REDIRECT_URI = `https://${process.env.HOST}:${process.env.PORT}/oauth/callback`;

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
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xlsx', '.csv', '.txt', '.tiff'];
const ALLOWED_MIME_PREFIXES = ['application/', 'image/'];

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

    // Normalize country value to Salesforce picklist API names (MA or Etranger)
    // Picklist API names: MA (Maroc), Etranger (without accent)
    let countryApiValue;
    if (req.body && req.body.country) {
      const c = String(req.body.country).trim().toLowerCase();
      if (/^ma(ro)?c?$/.test(c) || /^maroc$/.test(c)) {
        countryApiValue = 'MA';
      } else if (/^étrang(er)?$/.test(c) || /^etranger$/.test(c)) {
        // Use 'Etranger' without accent as per Salesforce picklist configuration
        countryApiValue = 'Etranger';
      } else {
        countryApiValue = c; // fallback: send raw value
      }
      console.log(`🌍 Country normalization: "${req.body.country}" -> "${countryApiValue}"`);
    }

    // Map frontend data to Salesforce Account fields
    const accountData = {
      Name: req.body.raisonSociale,
      RecordTypeId: '012WS0000031KxRYAU',
      
      // Company Information
      Phone: req.body.phone,
      Fax: req.body.fax,
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
      LegalForm__c: req.body.formeJuridique,
      CommonCompanyIdentifier__c: req.body.ice,
      Siret__c: req.body.siret,
      VATNumberMaroc__c: req.body.tva,
      EmailPrincipale__c: req.body.emailEntreprise,
      DateCreation__c: req.body.dateCreation,
      SupplierType__c: req.body.typeEntreprise,
      NumberOfEmployees: req.body.effectifTotal,
      Effectif_Encadrement__c: req.body.effectifEncadrement,
      ExercicesClos__c: req.body.exercicesClos,
      // Certifications may come as an array (JSON) or as a joined string depending on client
      Certifications__c: (function(c) {
        if (!c) return '';
        if (Array.isArray(c)) return c.join(';');
        if (typeof c === 'string') {
          try { const parsed = JSON.parse(c); if (Array.isArray(parsed)) return parsed.join(';') } catch (e) {}
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
      Fax: req.body.faxPro,
      Fix__c: req.body.fix,
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

    // Query for Account RecordType "Fournisseur à qualifier" (Supplier to qualify)
    let recordTypeId = null;
    try {
      const rtQuery = await conn.query(
        "SELECT Id FROM RecordType WHERE SObjectType='Account' AND DeveloperName='Fournisseur_a_qualifier' LIMIT 1"
      );
      if (rtQuery && rtQuery.records && rtQuery.records.length > 0) {
        recordTypeId = rtQuery.records[0].Id;
        console.log('✅ Found RecordType "Fournisseur à qualifier":', recordTypeId);
      } else {
        console.warn('⚠️ RecordType "Fournisseur_a_qualifier" not found. Trying by Name...');
        const rtQuery2 = await conn.query(
          "SELECT Id FROM RecordType WHERE SObjectType='Account' AND Name='Fournisseur à qualifier' LIMIT 1"
        );
        if (rtQuery2 && rtQuery2.records && rtQuery2.records.length > 0) {
          recordTypeId = rtQuery2.records[0].Id;
          console.log('✅ Found RecordType by Name:', recordTypeId);
        }
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
            if (file.size > MAX_UPLOAD_BYTES) {
              console.warn('File too large (server-side):', file.originalname);
              return res.status(400).json({ success: false, error: 'Un des fichiers dépasse la taille maximale autorisée.' });
            }
            const ext = path.extname(file.originalname || '').toLowerCase();
            const mime = (file.mimetype || '').toLowerCase();
            const extAllowed = ALLOWED_EXTENSIONS.includes(ext);
            const mimeOk = ALLOWED_MIME_PREFIXES.some(p => mime.startsWith(p));
            if (!extAllowed && !mimeOk) {
              console.warn('Disallowed file type (server-side):', file.originalname, mime);
              return res.status(400).json({ success: false, error: 'Type de fichier non autorisé.' });
            }
            if (/\.(exe|sh|bat|cmd|js|jar|msi)$/i.test(ext)) {
              console.warn('Executable file rejected (server-side):', file.originalname);
              return res.status(400).json({ success: false, error: 'Type de fichier dangereux non autorisé.' });
            }

            const base64 = file.buffer.toString('base64');
            // Original filename and base name (without extension)
            const originalName = file.originalname || 'file';
            const baseName = path.basename(originalName, ext) || 'FILE';
            // Derive a type label from baseName (part before any parenthesis), uppercase
            const typeLabelRaw = String(baseName).split('(')[0] || baseName;
            const titleType = typeLabelRaw.replace(/[^a-zA-Z0-9 _-]/g, '_').toUpperCase();
            // Company display name: use raisonSociale provided in the form (preserve case and spaces)
            const companyRaw = (req.body && (req.body.raisonSociale || req.body.raison || '')).trim();
            const companyDisplay = companyRaw ? String(companyRaw).replace(/[()]/g, '').replace(/\s+/g, ' ').slice(0, 60) : '';
            // Build Title as TYPE(COMPANY) e.g. STATUT(Marjane 5) — if no company, just TYPE
            const title = companyDisplay ? `${titleType}(${companyDisplay})` : titleType;
            // Include extension in PathOnClient so Salesforce has the filename with extension
            const pathOnClient = `${title}${ext}`;
            console.log('Uploading file to ContentVersion - Title:', title, 'PathOnClient:', pathOnClient, 'MIME:', file.mimetype);

            const cv = {
              Title: title,
              PathOnClient: pathOnClient,
              VersionData: base64,
              FirstPublishLocationId: accountResult.id
            };

            const cvRes = await conn.sobject('ContentVersion').create(cv);
            console.log('📤 ContentVersion created id=', cvRes.id, 'for file:', pathOnClient);
            // Query to get ContentDocumentId
            const q = await conn.query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id='${cvRes.id}'`);
            const contentDocumentId = q.records && q.records[0] && q.records[0].ContentDocumentId;
            if (contentDocumentId) {
              try {
                const linkResult = await conn.sobject('ContentDocumentLink').create({
                  ContentDocumentId: contentDocumentId,
                  LinkedEntityId: accountResult.id,
                  ShareType: 'V',
                  Visibility: 'AllUsers'
                });
                console.log('🔗 Linked ContentDocument to Account:', contentDocumentId, '-> Account:', accountResult.id);
                uploadedFiles.push({ fileName: pathOnClient, contentDocumentId });
              } catch (linkErr) {
                console.warn('⚠️ ContentDocumentLink create warning:', linkErr && linkErr.message ? linkErr.message : linkErr);
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
        uploadedFiles: res.locals.uploadedFiles || []
      },
      warnings: []
    };

    // Add warnings if contact wasn't created/linked
    if (!contactResult.id) {
      responseData.warnings.push('Contact could not be created or linked. The account was created successfully, but you may need to manually create or link the contact in Salesforce.');
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
      // Remove Salesforce record Ids (15 or 18 character alphanumeric)
      msg = msg.replace(/\b[0-9A-Za-z]{15,18}\b/g, '[id supprimé]');
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
    try {
      if (error && error.body) {
        // jsforce may put details in error.body (object or array)
        if (typeof error.body === 'string') detailed = error.body;
        else detailed = JSON.stringify(error.body);
      }
    } catch (e) {
      // ignore JSON errors
    }

    const safe = sanitizeMessage(detailed);

    res.status(500).json({
      success: false,
      error: safe
    });
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

// Start HTTPS server
https.createServer(httpsOptions, app).listen(PORT, HOST, () => {
  console.log(`\n🚀 HTTPS Server is running on https://${HOST}:${PORT}`);
  console.log(`\n📋 OAuth Flow:`);
  console.log(`   Login: https://${HOST}:${PORT}/login`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`   POST https://${HOST}:${PORT}/api/supplier`);
  console.log(`\n⚠️  Note: Login first at /login before submitting forms!`);
});

module.exports = app;
