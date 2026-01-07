
import React, { useState } from 'react';
import { Input, Select, FileUpload, MultiSelect } from '../FormComponents';
import { SupplierFormData } from '../../types';
import { Modal } from '../Modal';

interface StepProps {
  data: SupplierFormData;
  update: (field: keyof SupplierFormData, value: any) => void;
  errors?: Record<string, string>;
}

export const Step3Documents: React.FC<StepProps> = ({ data, update, errors }) => {
  const isMaroc = data.country === 'MA';
  const isEtranger = data.country !== 'MA' && !!data.country;
  const showFiles = isMaroc || isEtranger;

  const [isScanning, setIsScanning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  // State for Yearly Metrics (2026, 2025, 2024)
  const [selectedYear, setSelectedYear] = useState('2026');
  
  // Helper to parse comma-separated string into object
  const parseMetrics = (str: string) => {
    const parts = str ? str.split(',') : [];
    return {
      '2026': parts[0] || '',
      '2025': parts[1] || '',
      '2024': parts[2] || ''
    };
  };

  const [metrics, setMetrics] = useState(() => ({
    effectifTotal: parseMetrics(data.effectifTotal),
    effectifEncadrement: parseMetrics(data.effectifEncadrement)
  }));

  const updateMetric = (category: 'effectifTotal' | 'effectifEncadrement', year: string, value: string) => {
    const newCategoryMetrics = { ...metrics[category], [year]: value };
    const newMetrics = { ...metrics, [category]: newCategoryMetrics };
    setMetrics(newMetrics);
    
    // Update parent with comma-separated string: 2026,2025,2024
    update(category, `${newCategoryMetrics['2026']},${newCategoryMetrics['2025']},${newCategoryMetrics['2024']}`);
  };

  const handleScan = async () => {
    if (!data.filesAttestationRegulariteFiscale || data.filesAttestationRegulariteFiscale.length === 0) {
      alert("Veuillez d'abord télécharger l'Attestation de Régularité Fiscale.");
      return;
    }

    setIsScanning(true);
    const file = data.filesAttestationRegulariteFiscale[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/ocr/analyze`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'analyse du document');
      }

      setOcrResult(result);
      setShowModal(true);
    } catch (error: any) {
      console.error('Error scanning document:', error);
      alert(error.message || "Une erreur est survenue lors de l'analyse du document.");
    } finally {
      setIsScanning(false);
    }
  };


  const handleConfirm = () => {
    if (!ocrResult) return;

    console.log('OCR Result à envoyer pour créer l\'attestation:', ocrResult);

    // TODO: Envoyer les données OCR pour créer le record Attestation de Régularité Fiscale
    // Les données scannées seront stockées dans un objet séparé, pas dans le formulaire principal
    
    // Stocker temporairement les données OCR pour l'envoi final
    update('attestationRegulariteFiscaleData', ocrResult);

    setShowModal(false);
    // Plus d'alert - l'indicateur visuel dans la section suffit
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 animate-fade-in-up">
      <div className="mb-8 pb-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Documents & Informations</h2>
           <p className="text-sm text-gray-500 mt-1">Téléversez les justificatifs requis.</p>
        </div>
        {/* Helper Badge */}
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-medium border border-blue-100 flex items-center gap-2">
           <i className="fas fa-info-circle"></i>
           <span>Formats acceptés : PDF, JPG, PNG (Max 5Mo)</span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            type="date"
            label="1. Date de création"
            helperText="Merci de renseigner la date de création de votre entreprise."
            value={data.dateCreation}
            onChange={e => update('dateCreation', e.target.value)}
            error={errors?.dateCreation}
          />

          <Select 
            label="2. Type d’entreprise" 
            options={[
              {value: 'Manufacture', label: 'Manufacture'}, 
              {value: 'Service', label: 'Service'},
              {value: 'Médecin', label: 'Médecin'},
              {value: 'Avocat', label: 'Avocat'},
              {value: 'Notaire', label: 'Notaire'},
              {value: 'Laboratoire', label: 'Laboratoire'},
              {value: 'Clinique', label: 'Clinique'}
            ]}
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

              {/* Section Attestation de Régularité Fiscale avec Scanner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <FileUpload 
                  id="attestationRegulariteFiscale"
                  label="10. Attestation de Régularité Fiscale"
                  description="Merci de joindre l'Attestation de Régularité Fiscale (un seul fichier)."
                  files={data.filesAttestationRegulariteFiscale}
                  onFilesChange={f => update('filesAttestationRegulariteFiscale', f.slice(0, 1))}
                  maxFiles={1}
                />
                
                {/* Boutons Scanner et Voir */}
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning || !data.filesAttestationRegulariteFiscale?.length}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isScanning || !data.filesAttestationRegulariteFiscale?.length
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>Analyse en cours...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>Scanner le document</span>
                      </>
                    )}
                  </button>
                  
                  {ocrResult && (
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-white border border-indigo-300 transition-all hover:bg-indigo-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Voir les résultats</span>
                    </button>
                  )}
                </div>
                {data.attestationRegulariteFiscaleData && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-300 rounded-lg">
                    <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">Document scanné et validé</span>
                  </div>
                )}
              </div>
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

        <div className="mb-4">
          <Input 
            type="number"
            label="12. Nombre d'années d'ancienneté"
            value={data.exercicesClos}
            onChange={e => update('exercicesClos', e.target.value)}
          />
        </div>

        {/* Collapsible Metrics Section */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-gray-900">Données Chiffrées (Effectifs & Ancienneté)</h3>
                <p className="text-xs text-gray-500">Cliquez pour renseigner les données sur 3 ans</p>
              </div>
            </div>
            <svg 
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isMetricsExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isMetricsExpanded && (
            <div className="p-4 border-t border-gray-200 animate-fade-in">
              {/* Year Selector for all metrics */}
              <div className="flex justify-end mb-4">
                <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                  {['2026', '2025', '2024'].map(year => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setSelectedYear(year)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        selectedYear === year 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 10. Effectif Total */}
                <div className="flex flex-col">
                  <label className="text-xs font-medium mb-1.5 text-text-main">
                    10. Effectif Total ({selectedYear})
                  </label>
                  <input
                    type="number"
                    value={metrics.effectifTotal[selectedYear as keyof typeof metrics.effectifTotal]}
                    onChange={(e) => updateMetric('effectifTotal', selectedYear, e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                {/* 11. Effectif Encadrement */}
                <div className="flex flex-col">
                  <label className="text-xs font-medium mb-1.5 text-text-main">
                    11. Effectif Encadrement ({selectedYear})
                  </label>
                  <input
                    type="number"
                    value={metrics.effectifEncadrement[selectedYear as keyof typeof metrics.effectifEncadrement]}
                    onChange={(e) => updateMetric('effectifEncadrement', selectedYear, e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>
            </div>
          )}
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
            'ISO 26000'
          ]}
          selected={data.certifications}
          onChange={selected => update('certifications', selected)}
        />

        <Input
          label="Précisez des autres certifications"
          placeholder="Saisissez une certification et appuyez sur Entrée"
          value={data.certificationsAutre}
          onChange={e => update('certificationsAutre', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const val = data.certificationsAutre.trim();
              if (val && !data.certifications.includes(val)) {
                update('certifications', [...data.certifications, val]);
                update('certificationsAutre', '');
              }
            }
          }}
          maxLength={255}
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Résultats de l'analyse"
        footer={
          <div className="flex justify-between w-full">
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 text-white bg-primary rounded-lg hover:bg-primary-dark font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              Confirmer et Valider
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        }
      >
        {ocrResult && (
          <div className="space-y-3">
            {/* Fields grid - editable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(ocrResult).map(([key, value]: [string, any]) => {
                // Format the label nicely
                const formatLabel = (k: string) => {
                  const labels: Record<string, string> = {
                    'numero_attestation': 'N° Attestation',
                    'numero_d_identification_fiscale': 'N° ID Fiscale',
                    'ice': 'ICE',
                    'registre_de_commerce': 'Registre Commerce',
                    'taxe_professionnelle': 'Taxe Pro.',
                    'date_reception': 'Date Réception',
                    'date_edition': 'Date Édition',
                    'statut_regularite': 'En Régularité',
                    'statut_garanties': 'Garanties',
                    'nest_pas_en_regle': 'Non conforme'
                  };
                  return labels[k] || k.replace(/_/g, ' ');
                };

                // Format date to DD-MM-YYYY for display
                const formatDateForDisplay = (dateStr: string) => {
                  if (!dateStr) return '';
                  // If already DD-MM-YYYY, return as is
                  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
                  // If YYYY-MM-DD, convert to DD-MM-YYYY
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    const [y, m, d] = dateStr.split('-');
                    return `${d}-${m}-${y}`;
                  }
                  return dateStr;
                };

                const isBoolean = typeof value === 'boolean';
                const isDateField = key === 'date_reception' || key === 'date_edition';

                return (
                  <div 
                    key={key} 
                    className={`px-3 py-2 rounded-lg border ${
                      isBoolean 
                        ? value 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {formatLabel(key)}
                    </div>
                    <div>
                      {isBoolean ? (
                         <div className="text-xs font-bold text-gray-800 py-1">
                           {value ? '✓ Oui' : '✗ Non'}
                         </div>
                      ) : (
                        <div className="text-xs font-semibold text-gray-900 py-1 break-all">
                          {isDateField ? formatDateForDisplay(value?.toString() || '') : (value?.toString() || '-')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info message - compact */}
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">
                Vérifiez les informations extraites ci-dessus avant de confirmer.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
