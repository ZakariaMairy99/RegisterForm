import React from 'react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-600 mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.29 3.86L1.82 18.14A2 2 0 0 0 3.61 21h16.78a2 2 0 0 0 1.79-2.86L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Page non trouvée</h1>
        <p className="text-gray-600 mb-6">La page demandée n'existe pas ou le lien est invalide. Revenez à l'accueil pour poursuivre l'enregistrement.</p>
        <a href="/" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold">Retour à l'accueil</a>
      </div>
    </div>
  );
};

export default NotFound;
