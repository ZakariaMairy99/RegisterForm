import React from 'react';

type Step5ConfirmationProps = {
  onReset?: () => void;
};

export const Step5Confirmation: React.FC<Step5ConfirmationProps> = ({ onReset }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 animate-fade-in-up">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600 rounded-t-2xl"></div>

      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
        <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-200 border-4 border-white">
          <i className="fas fa-check text-4xl"></i>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
        Dossier soumis avec succès
      </h2>
      
      <p className="text-sm text-gray-600 max-w-xl mb-10 leading-relaxed">
        Votre demande d'adhésion au portail fournisseur a été transmise à nos équipes de certification. Vous recevrez une confirmation détaillée par email.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-10">
        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left">
           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-3">
              <i className="fas fa-envelopes-bulk"></i>
           </div>
           <h4 className="font-semibold text-gray-900 text-sm mb-1.5">Email de confirmation</h4>
           <p className="text-xs text-gray-600 leading-relaxed">Un récapitulatif complet vient de vous être envoyé.</p>
        </div>

        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left">
           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm mb-3">
              <i className="fas fa-clipboard-check"></i>
           </div>
           <h4 className="font-semibold text-gray-900 text-sm mb-1.5">Examen du dossier</h4>
           <p className="text-xs text-gray-600 leading-relaxed">Nos équipes vérifient vos documents sous 48h ouvrées.</p>
        </div>

        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left">
           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm mb-3">
              <i className="fas fa-id-card-clip"></i>
           </div>
           <h4 className="font-semibold text-gray-900 text-sm mb-1.5">Accès au portail</h4>
           <p className="text-xs text-gray-600 leading-relaxed">Vous recevrez vos identifiants de connexion par email.</p>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 w-full max-w-xl text-center space-y-3">
        <p className="text-xs text-gray-500">Une question sur votre soumission ?</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-xs font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors">
            <i className="fas fa-headset mr-1.5"></i> Contacter le support
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-700 hover:border-blue-700 transition-colors disabled:opacity-60"
          >
            <i className="fas fa-rotate-left mr-1.5"></i> Revenir à la première étape
          </button>
        </div>
      </div>
    </div>
  );
};
