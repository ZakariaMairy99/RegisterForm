
import React from 'react';

interface StepProps {
  onReset: () => void;
}

export const Step5Confirmation: React.FC<StepProps> = ({ onReset }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center py-12 animate-scale-in bg-app-surface rounded-3xl shadow-sm border border-app-border my-auto">
      <div className="w-28 h-28 bg-success/10 rounded-full flex items-center justify-center mb-8 shadow-success/20 shadow-xl relative">
        <div className="absolute inset-0 rounded-full border-4 border-white"></div>
        <i className="fas fa-check text-5xl text-success"></i>
      </div>
      <h2 className="text-4xl font-extrabold text-text-main mb-4">Candidature Soumise !</h2>
      <p className="text-text-muted max-w-lg mb-10 text-lg">Votre demande d'inscription en tant que fournisseur a été reçue. Nos équipes vont traiter votre dossier dans les plus brefs délais.</p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          type="button" 
          onClick={onReset}
          className="px-8 py-4 bg-secondary text-white rounded-xl hover:bg-black font-bold transition-all shadow-xl shadow-secondary/10 hover:shadow-secondary/20 flex items-center justify-center gap-2"
        >
          <i className="fas fa-home"></i> RETOUR À L'ACCUEIL
        </button>
      </div>
    </div>
  );
};
