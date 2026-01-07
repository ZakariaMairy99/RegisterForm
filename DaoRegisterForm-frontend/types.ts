export interface SupplierFormData {
  // Step 1: Données entreprise
  country: string;
  raisonSociale: string;
  nomCommercial: string;
  rc: string;
  formeJuridique: string;
  formeJuridiqueAutre: string;
  ice: string;
  siret: string;
  tva: string;
  identifiantFiscal: string;
  identifiantFiscal1: string;
  identifiantFiscal2: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  website: string;
  emailEntreprise: string;

  // Step 2: Contact principal
  civility: string;
  contactNom: string;
  contactPrenom: string;
  contactMobile: string;
  otherPhone: string;
  email: string;
  language: string;
  timezone: string;

  // Step 3: Documents
  dateCreation: string;
  typeEntreprise: string;
  effectifTotal: string;
  effectifEncadrement: string;
  exercicesClos: string;
  certifications: string[];
  certificationsAutre: string;
  hsePolicy: string;
  
  // Files - Maroc
  filesAttestationRC: File[];
  filesAttestationRIB: File[];
  filesAttestationTVA: File[];
  filesICE: File[];
  filesIdentifiantFiscal: File[];
  filesPresentationCommerciale: File[];
  filesAttestationRegulariteFiscale: File[];
  filesStatutMaroc: File[];
  
  // Files - Étranger
  filesAttestationAT: File[];
  filesAttestationRC_Etranger: File[];
  filesAttestationRIB_Etranger: File[];
  filesICE_Etranger: File[];
  
  // Données OCR de l'Attestation de Régularité Fiscale (scannées via Mindee)
  attestationRegulariteFiscaleData?: {
    numero_attestation?: string;
    numero_d_identification_fiscale?: string;
    ice?: string;
    registre_de_commerce?: string;
    taxe_professionnelle?: string | number;
    date_reception?: string;
    date_edition?: string;
    statut_regularite?: boolean;
    statut_garanties?: boolean;
    nest_pas_en_regle?: boolean;
  };
  
  // Optional logo URL retrieved from backend custom metadata
  logoUrl?: string;
  // Human readable name to show next to the logo (from custom metadata)
  logoName?: string;
  // Developer/API name of the metadata record (useful as fallback/alt)
  logoDeveloper?: string;
}

export const INITIAL_DATA: SupplierFormData = {
  country: '',
  raisonSociale: '',
  nomCommercial: '',
  rc: '',
  formeJuridique: '',
  formeJuridiqueAutre: '',
  ice: '',
  siret: '',
  tva: '',
  identifiantFiscal: '',
  identifiantFiscal1: '',
  identifiantFiscal2: '',
  address: '',
  postalCode: '',
  city: '',
  phone: '',
  website: '',
  emailEntreprise: '',
  civility: '',
  contactNom: '',
  contactPrenom: '',
  contactMobile: '',
  otherPhone: '',
  email: '',
  language: 'fr',
  timezone: 'WET',
  dateCreation: '',
  typeEntreprise: '',
  effectifTotal: '',
  effectifEncadrement: '',
  exercicesClos: '',
  certifications: [],
  certificationsAutre: '',
  hsePolicy: 'oui',
  filesAttestationRC: [],
  filesAttestationRIB: [],
  filesAttestationTVA: [],
  filesICE: [],
  filesIdentifiantFiscal: [],
  filesPresentationCommerciale: [],
  filesAttestationRegulariteFiscale: [],
  filesStatutMaroc: [],
  filesAttestationAT: [],
  filesAttestationRC_Etranger: [],
  filesAttestationRIB_Etranger: [],
  filesICE_Etranger: [],
  attestationRegulariteFiscaleData: undefined,
  logoUrl: '',
  logoName: '',
  logoDeveloper: '',
};

export const STEPS = [
  { title: "Données d'organisation principale", label: "ÉTAPE 01" },
  { title: "Contact principal de l’entreprise", label: "ÉTAPE 02" },
  { title: "Documents", label: "ÉTAPE 03" },
  { title: "Récapitulatif", label: "ÉTAPE 04" },
  { title: "Confirmation", label: "ÉTAPE 05" },
];