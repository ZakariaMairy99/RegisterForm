require('dotenv').config();
const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const HOST = process.env.HOST || '0.0.0.0';

const attrs = [{ name: 'commonName', value: HOST }];
const options = {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'subjectAltName',
      altNames: [
        { type: 7, ip: HOST },
        { type: 7, ip: '127.0.0.1' },
        { type: 2, value: 'localhost' }
      ]
    }
  ]
};

const pems = selfsigned.generate(attrs, options);

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// Write certificate and key files
fs.writeFileSync(path.join(certsDir, 'localhost.crt'), pems.cert);
fs.writeFileSync(path.join(certsDir, 'localhost.key'), pems.private);

console.log('✅ SSL certificates generated successfully!');
console.log('Certificate saved to: certs/localhost.crt');
console.log('Private key saved to: certs/localhost.key');
