import React from 'react';
import { SupplierFormData } from '../../types';

interface StepProps {
  data: SupplierFormData;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  submitWarnings?: string[] | null;
  validationErrors?: Record<string, string> | null;
  goToStep?: (n: number) => void;
  fileErrors?: Record<string, string[]> | null;
}

export const Step4Recap: React.FC<StepProps> = ({ data, onConfirm, isSubmitting, submitError, submitWarnings, validationErrors, goToStep, fileErrors }) => {
  
  const renderRecapItem = (label: string, value: string, fieldKey?: string) => {
    const hasError = fieldKey && validationErrors && validationErrors[fieldKey];
    return (
      <div className={`border-b border-gray-100 last:border-0 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 ${hasError ? 'bg-red-50 border-red-200 rounded-md p-2' : ''}`}>
        <span className={`${hasError ? 'text-red-700 font-semibold' : 'text-xs font-semibold text-text-muted'} uppercase tracking-wide`}>{label}</span>
        <span className={`${hasError ? 'text-red-700 font-medium' : 'text-sm font-medium text-text-main'} text-right break-words max-w-full sm:max-w-[60%]`}>{value || '---'}</span>
      </div>
    );
  };

  const handleNextStep = (stepIndex: number) => {
    if (goToStep) {
      goToStep(stepIndex);
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      {submitError ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <strong className="font-semibold">Erreur lors de l'envoi:</strong>
          <div className="mt-1 text-sm">{submitError}</div>
        </div>
      ) : null}

      {submitWarnings && submitWarnings.length > 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          <strong className="font-semibold">Avertissements:</strong>
          <ul className="mt-1 ml-4 list-disc list-inside text-sm">
            {submitWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="bg-app-surface p-4 md:p-5 rounded-2xl shadow-sm border border-app-border">
        <h2 className="text-lg font-bold text-text-main mb-1">Récapitulatif de votre candidature</h2>
        <p className="text-xs text-text-muted">Vérifiez attentivement vos informations avant l'envoi définitif.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-app-surface rounded-2xl shadow-sm border border-app-border p-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm">
              <i className="fas fa-building"></i>
            </div>
            <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">Données entreprise</h3>
          </div>
          <div className="space-y-0.5">
            {renderRecapItem("Pays", data.country, 'country')}
            {renderRecapItem("Raison sociale", data.raisonSociale, 'raisonSociale')}
            {renderRecapItem("Nom Commercial", data.nomCommercial, 'nomCommercial')}
            {renderRecapItem("Forme juridique", data.formeJuridique, 'formeJuridique')}
            {renderRecapItem("ICE / DUNS", data.ice, 'ice')}
            {renderRecapItem("SIRET", data.siret, 'siret')}
            {renderRecapItem("TVA", data.tva, 'tva')}
            {renderRecapItem("Adresse", data.address, 'address')}
            {renderRecapItem("Code Postal", data.postalCode, 'postalCode')}
            {renderRecapItem("Ville", data.city, 'city')}
            {renderRecapItem("Téléphone", data.phone, 'phone')}
            {renderRecapItem("Fax", data.fax, 'fax')}
            {renderRecapItem("Site web", data.website, 'website')}
            {renderRecapItem("Email entreprise", data.emailEntreprise, 'emailEntreprise')}
          </div>
        </div>

        <div className="bg-app-surface rounded-2xl shadow-sm border border-app-border p-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">
              <i className="fas fa-user"></i>
            </div>
            <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">Contact</h3>
          </div>
          <div className="space-y-0.5">
            {renderRecapItem("Nom complet", `${data.contactPrenom} ${data.contactNom}`, 'contactNom')}
            {renderRecapItem("Civilité", data.civility, 'civility')}
            {renderRecapItem("Mobile", data.contactMobile, 'contactMobile')}
            {renderRecapItem("Fix", data.fix, 'fix')}
          </div>
        </div>

        <div className="bg-app-surface rounded-2xl shadow-sm border border-app-border p-4 md:col-span-2 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
              <i className="fas fa-file-alt"></i>
            </div>
            <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">Documents & Info</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            {renderRecapItem("Date création", data.dateCreation, 'dateCreation')}
            {renderRecapItem("Type", data.typeEntreprise, 'typeEntreprise')}
            {renderRecapItem("Certifications", data.certifications.join(', ') || 'Aucune', 'certifications')}
            {renderRecapItem("Politique HSE", data.hsePolicy, 'hsePolicy')}
            {renderRecapItem("Fichiers joints", `${data.filesAttestationRC.length + data.filesAttestationRIB.length + data.filesAttestationTVA.length + data.filesICE.length + data.filesIdentifiantFiscal.length + data.filesPresentationCommerciale.length + data.filesStatutMaroc.length + data.filesAttestationAT.length + data.filesAttestationRC_Etranger.length + data.filesAttestationRIB_Etranger.length + data.filesICE_Etranger.length} fichiers`, 'filesAttestationRC')}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-5">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting || (validationErrors && Object.keys(validationErrors).length > 0) || (fileErrors && Object.keys(fileErrors).length > 0)}
          className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Envoi en cours...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i>
              CONFIRMER ET ENVOYER
            </>
          )}
        </button>
      </div>
    </div>
  );
};
