# DaoRegisterForm Project Instructions

## Project Overview
This project is a multi-step supplier registration portal consisting of a React/TypeScript frontend and a Node.js/Express backend that integrates with Salesforce, Google Gemini, and Mindee.

## Workspace Structure
- `DaoRegisterForm-backend/`: Node.js Express API.
- `DaoRegisterForm-frontend/`: React Vite SPA.

## Architecture & Integration Points
- **Salesforce Integration**: The backend uses `jsforce` to interact with Salesforce. Authentication is session-based via OAuth 2.0. Users must first hit `https://HOST:PORT/login` to authenticate before submitting forms.
- **OCR Logic**: Document analysis is handled via Google Gemini (`gemini-1.5-flash-001`) at the `/api/ocr/analyze` endpoint. It extracts structured JSON from uploaded documents.
- **Form State**: Frontend state is managed in `DaoRegisterForm-frontend/hooks/useSupplierForm.ts`. It includes auto-save functionality to `localStorage`.
- **File Uploads**: Files are received as multipart/form-data, uploaded to Salesforce as `ContentVersion` records, and linked to the created `Account`.

## Development Workflows
- **SSL/HTTPS**: Both components MUST run over HTTPS. 
  - Backend: Run `node generate-certs.js` once, then `npm start`.
  - Frontend: Uses `@vitejs/plugin-basic-ssl`.
- **Environment Setup**:
  - Backend: Copy `.env.example` to `.env`. Requires `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`, and `GEMINI_API_KEY`.
  - Frontend: Requires `VITE_API_URL` pointing to the backend.

## Coding Conventions
- **Salesforce Field Mapping**: Many fields use custom Salesforce API names (e.g., `RC__c`, `ICE__c`). Refer to `DaoRegisterForm-backend/index.js` for existing mappings.
- **Error Handling**: Use the `sanitizeForClient` helper in the backend to clean up Salesforce error messages (removing IDs and raw API names) before returning to the frontend.
- **TypeScript**: Use the interfaces defined in `DaoRegisterForm-frontend/types.ts` for all form-related data structures.
- **Step Components**: Each form step should reside in `DaoRegisterForm-frontend/components/steps/` and follow the pattern established in existing steps.

## Critical Files
- Backend Entry: [DaoRegisterForm-backend/index.js](DaoRegisterForm-backend/index.js)
- Frontend Entry: [DaoRegisterForm-frontend/index.tsx](DaoRegisterForm-frontend/index.tsx)
- Form Hook: [DaoRegisterForm-frontend/hooks/useSupplierForm.ts](DaoRegisterForm-frontend/hooks/useSupplierForm.ts)
- Types: [DaoRegisterForm-frontend/types.ts](DaoRegisterForm-frontend/types.ts)
