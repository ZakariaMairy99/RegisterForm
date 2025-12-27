
import React from 'react';
import { Input, Select, FileUpload, MultiSelect } from '../FormComponents';
import { SupplierFormData } from '../../types';

interface StepProps {
  data: SupplierFormData;
  update: (field: keyof SupplierFormData, value: any) => void;
  errors?: Record<string, string>;
}

export const Step3Documents: React.FC<StepProps> = ({ data, update, errors }) => {
  const isMaroc = data.country === 'MAROC';
  const isEtranger = data.country === 'ETRANGER';
  const showFiles = isMaroc || isEtranger;

  return (
    <div className="animate-fade-in bg-app-surface p-6 md:p-8 rounded-2xl shadow-sm border border-app-border">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-main">Documents requis</h2>
        <p className="text-xs text-text-muted mt-0.5">Téléversez les justificatifs au format PDF ou Image.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input 
            type="date"
            label="1. Date de création"
            helperText="Merci de renseigner la date de création de votre entreprise."
            value={data.dateCreation}
            onChange={e => update('dateCreation', e.target.value)}
            error={errors?.dateCreation}
          />

          <Select 
            label="2. Type entreprise" 
            options={[{value: 'Manufacture', label: 'Manufacture'}, {value: 'Service', label: 'Service'}]}
            value={data.typeEntreprise}
            onChange={e => update('typeEntreprise', e.target.value)}
            error={errors?.typeEntreprise}
          />
        </div>

        <div className="space-y-4">
          {!showFiles && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              Merci de sélectionner un pays à l'étape 1 pour afficher les fichiers requis.
            </div>
          )}

          {isMaroc && (
            <>
              <FileUpload 
                id="attestationRC"
                label="3. Attestation RC"
                description="Merci de joindre l'Attestation du Registre de Commerce."
                files={data.filesAttestationRC}
                onFilesChange={f => update('filesAttestationRC', f)}
              />

              <FileUpload 
                id="attestationRIB"
                label="4. Attestation RIB"
                description="Merci de joindre l'Attestation RIB."
                files={data.filesAttestationRIB}
                onFilesChange={f => update('filesAttestationRIB', f)}
              />

              <FileUpload 
                id="attestationTVA"
                label="5. Attestation TVA"
                description="Merci de joindre l'Attestation TVA."
                files={data.filesAttestationTVA}
                onFilesChange={f => update('filesAttestationTVA', f)}
              />

              <FileUpload 
                id="ice"
                label="6. ICE"
                description="Merci de joindre votre ICE."
                files={data.filesICE}
                onFilesChange={f => update('filesICE', f)}
              />

              <FileUpload 
                id="identifiantFiscal"
                label="7. Identifiant Fiscal"
                description="Merci de joindre votre Identifiant Fiscal."
                files={data.filesIdentifiantFiscal}
                onFilesChange={f => update('filesIdentifiantFiscal', f)}
              />

              <FileUpload 
                id="presentationCommerciale"
                label="8. Présentation Commerciale"
                description="Merci de joindre une présentation commerciale de votre entreprise."
                files={data.filesPresentationCommerciale}
                onFilesChange={f => update('filesPresentationCommerciale', f)}
              />

              <FileUpload 
                id="statutMaroc"
                label="9. Statut"
                description="Merci de joindre les statuts de votre entreprise."
                files={data.filesStatutMaroc}
                onFilesChange={f => update('filesStatutMaroc', f)}
              />
            </>
          )}

          {isEtranger && (
            <>
              <FileUpload 
                id="attestationAT"
                label="3. Attestation d'assurance (AT)"
                description="Merci de joindre l'Attestation d'assurance Accidents du Travail."
                files={data.filesAttestationAT}
                onFilesChange={f => update('filesAttestationAT', f)}
              />

              <FileUpload 
                id="attestationRCEtranger"
                label="4. Attestation d'assurance (RC)"
                description="Merci de joindre l'Attestation d'assurance Responsabilité Civile."
                files={data.filesAttestationRC_Etranger}
                onFilesChange={f => update('filesAttestationRC_Etranger', f)}
              />

              <FileUpload 
                id="attestationRIBEtranger"
                label="5. Attestation RIB"
                description="Merci de joindre l'Attestation RIB."
                files={data.filesAttestationRIB_Etranger}
                onFilesChange={f => update('filesAttestationRIB_Etranger', f)}
              />

            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input 
            type="number"
            label="10. Effectif total"
            value={data.effectifTotal}
            onChange={e => update('effectifTotal', e.target.value)}
          />

          <Input 
            type="number"
            label="11. Effectif encadrement"
            value={data.effectifEncadrement}
            onChange={e => update('effectifEncadrement', e.target.value)}
          />

          <Input 
            type="number"
            label="12. Nombre d'exercices clos"
            value={data.exercicesClos}
            onChange={e => update('exercicesClos', e.target.value)}
          />
        </div>

        <MultiSelect 
          label="13. Certifications générales"
          description="Merci de sélectionner dans la liste les certifications générales."
          options={[
            'ISO 9001',
            'ISO 14001',
            'OHSAS 18001',
            'ISO 45001',
            'ISO 27001',
            'HACCP',
            'CMMI',
            'ISO 50001',
            'IATF 16949',
            'ISO 20000-1',
            'ISO 26000',
            'SA 8000'
          ]}
          selected={data.certifications}
          onChange={selected => update('certifications', selected)}
        />

        <div className="flex flex-col gap-3 p-5 bg-gray-50 rounded-xl border border-gray-200">
          <label className="text-sm font-bold text-text-main">14. Politique HSE</label>
          <p className="text-xs text-text-muted">Existe-t-il une politique HSE dans votre entreprise ?</p>
          <div className="flex gap-6 mt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="radio" 
                  name="hsePolicy" 
                  value="oui" 
                  checked={data.hsePolicy === 'oui'}
                  onChange={e => update('hsePolicy', e.target.value)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-primary peer-checked:bg-primary transition-all"></div>
                <div className="w-2 h-2 bg-white rounded-full absolute left-1.5 top-1.5 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-sm font-medium text-text-muted group-hover:text-text-main">Oui</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="radio" 
                  name="hsePolicy" 
                  value="non" 
                  checked={data.hsePolicy === 'non'}
                  onChange={e => update('hsePolicy', e.target.value)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-primary peer-checked:bg-primary transition-all"></div>
                <div className="w-2 h-2 bg-white rounded-full absolute left-1.5 top-1.5 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-sm font-medium text-text-muted group-hover:text-text-main">Non</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
