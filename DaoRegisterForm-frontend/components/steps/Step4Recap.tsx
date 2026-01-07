
import React from 'react';
import { SupplierFormData } from '../../types';

interface StepProps {
  data: SupplierFormData;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  submitWarnings?: string[] | null;
  validationErrors?: Record<string, string>;
  goToStep?: (step: number) => void;
  fileErrors?: Record<string, string[]>;
}

export const Step4Recap: React.FC<StepProps> = ({ data, onConfirm, isSubmitting, submitError, submitWarnings, validationErrors, goToStep, fileErrors }) => {
  const SummarySection = ({ icon, title, children, colorClass }: { icon: string, title: string, children: React.ReactNode, colorClass: string }) => (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg shadow-gray-100/50 transition-all duration-300">
      <div className={`px-6 py-4 ${colorClass} text-white flex items-center gap-3`}>
        <i className={`fas ${icon} text-lg`}></i>
        <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  const SummaryItem = ({ label, value }: { label: string, value: string | undefined }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-xs font-semibold text-gray-800 truncate block min-h-[18px]">{value || '-'}</span>
    </div>
  );

  const FileStatus = ({ label, files }: { label: string, files?: File[] }) => {
    const hasFile = files && files.length > 0;
    return (
      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
        <span className="text-[11px] font-semibold text-gray-600">{label}</span>
        {hasFile ? (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
            <i className="fas fa-check-circle text-xs"></i> Téléchargé
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase bg-rose-100 text-slate-500 px-2.5 py-0.5 rounded-full opacity-60">
            <i className="fas fa-minus-circle text-xs"></i> Non requis / Manquant
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 animate-fade-in-up">
      <div className="mb-8 pb-4 border-b border-gray-50">
         <h2 className="text-2xl font-bold text-gray-900">Récapitulatif Final</h2>
         <p className="text-sm text-gray-500 mt-1">Veuillez vérifier vos informations avant la soumission finale.</p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-700 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i> Erreur de soumission
          </p>
          <p className="text-xs text-red-600 mt-1">{submitError}</p>
        </div>
      )}

      {submitWarnings && submitWarnings.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-2">
            <i className="fas fa-triangle-exclamation"></i> Avertissements
          </p>
          <ul className="text-xs text-amber-600 mt-2 ml-5 list-disc">
            {submitWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Organization Info */}
          <SummarySection icon="fa-building" title="Informations Société" colorClass="bg-blue-600">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <SummaryItem label="Raison Sociale" value={data.raisonSociale} />
              <SummaryItem label="Forme Juridique" value={data.formeJuridique} />
              <SummaryItem label="ICE" value={data.ice} />
              <SummaryItem label="RC" value={data.rc} />
              <SummaryItem label="Identifiant Fiscal" value={data.identifiantFiscal} />
              <SummaryItem label="Ville" value={data.city} />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <SummaryItem label="Adresse Complète" value={`${data.address}, ${data.postalCode} ${data.city} - ${data.country}`} />
            </div>
          </SummarySection>

          {/* Contact Person */}
          <SummarySection icon="fa-user-tie" title="Contact Principal" colorClass="bg-slate-800">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <SummaryItem label="Nom Complet" value={`${data.civility} ${data.contactPrenom} ${data.contactNom}`} />
              <SummaryItem label="Email" value={data.email} />
              <SummaryItem label="Téléphone Mobile" value={data.contactMobile} />
              <SummaryItem label="Autre Téléphone" value={data.otherPhone} />
              <SummaryItem label="Langue" value={data.language} />
              <SummaryItem label="Fuseau Horaire" value={data.timezone} />
            </div>
          </SummarySection>

          {/* Documents Status */}
          <SummarySection icon="fa-file-shield" title="Statut des Documents" colorClass="bg-emerald-600">
             <div className="space-y-3">
                <FileStatus label="Registre de Commerce (RC/Kbis)" files={data.filesAttestationRC} />
                <FileStatus label="Relevé d'Identité Bancaire (RIB)" files={data.filesAttestationRIB} />
                <FileStatus label="Identifiant Fiscal" files={data.filesIdentifiantFiscal} />
                <FileStatus label="Attestation Régularité Fiscale" files={data.filesAttestationRegulariteFiscale} />
                <FileStatus label="Statuts" files={data.filesStatutMaroc} />
             </div>
          </SummarySection>

          {/* Verification Badge */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 text-white flex flex-col items-center justify-center text-center shadow-xl shadow-blue-200">
             <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20">
                <i className="fas fa-shield-alt text-3xl"></i>
             </div>
             <h3 className="text-lg font-bold mb-2">Prêt pour la soumission ?</h3>
             <p className="text-blue-100 text-xs leading-relaxed mb-6 max-w-xs">
               En cliquant sur "Confirmer", vos données seront cryptées et transmises à nos services de conformité.
             </p>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <i className="fas fa-lock"></i> AES-256 Secured
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
