# DaoRegisterForm Frontend

Modern supplier registration form built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and update. Use the appropriate command for your shell:

   - macOS / Linux / Git Bash:
   ```bash
   cp .env.example .env
   ```
   - PowerShell (Windows):
   ```powershell
   Copy-Item .env.example .env
   ```
   - Command Prompt (Windows):
   ```cmd
   copy .env.example .env
   ```
   
   Update the backend API URL and host:
   ```env
   VITE_API_URL=https://10.69.2.48:3001
   VITE_HOST=10.69.2.48
   ```

   > 💡 Note: Vite is configured to run over HTTPS for local development; your browser may warn about an untrusted certificate—accept it or import the generated cert as trusted.

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will run on `https://10.69.2.48:3000/` (or `https://localhost:3000/`). Vite is configured with `https: true` and uses the `@vitejs/plugin-basic-ssl` plugin to generate a development certificate. If you get an HTTPS warning, accept or trust the certificate in your browser.

   If you need a different port, set `PORT` when launching Vite or update `vite.config.ts`.

## 📁 Project Structure

```
DaoRegisterForm-frontend/
├── components/
│   ├── Layout.tsx           # Main layout wrapper
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── FormComponents.tsx   # Reusable form inputs
│   └── steps/
│       ├── Step1Organization.tsx  # Company info
│       ├── Step2Contact.tsx       # Contact details
│       ├── Step3Documents.tsx     # Document upload
│       ├── Step4Recap.tsx         # Review & confirm
│       └── Step5Confirmation.tsx  # Success message
├── hooks/
│   └── useSupplierForm.ts   # Form state management
├── types.ts                 # TypeScript definitions
├── App.tsx                  # Main app component
└── index.tsx                # Entry point
```

## ✨ Features

### Multi-Step Form
- **Step 1:** Organization information (company name, address, contact)
- **Step 2:** Principal contact details
- **Step 3:** Document uploads (certifications, policies)
- **Step 4:** Review and confirmation
- **Step 5:** Success confirmation

### Form Management
- ✅ **Auto-save** - Progress automatically saved to localStorage
- ✅ **Manual save** - Click "Sauvegarder" button anytime
- ✅ **Auto-restore** - Returns to last step on page reload
- ✅ **Validation** - Required fields enforced
- ✅ **File uploads** - Multiple document support

### Backend Integration
- ✅ Salesforce integration via REST API
- ✅ OAuth authentication handling
- ✅ Error handling with user prompts

## 🔧 Configuration

### API URL
Set the backend URL in `.env`:
```env
VITE_API_URL=https://10.69.2.48:3001
```

If not set, defaults to `https://10.69.2.48:3001`

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🔐 Authentication Flow

1. User fills out form
2. On submit, form sends data to backend
3. If backend not authenticated (401 error):
   - User prompted to login
   - Opens Salesforce OAuth window
   - After login, user can resubmit
4. On success, shows confirmation page

## 💾 Local Storage

Form state is automatically saved to localStorage:
- **Key:** `supplierFormState`
- **Data:** Form data + current step
- **Cleared:** On successful submission or return home

## 🎨 Styling

- **Framework:** Tailwind CSS
- **Icons:** Font Awesome
- **Theme:** Custom color scheme in `index.css`

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📦 Dependencies

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Font Awesome
