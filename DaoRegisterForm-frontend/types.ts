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
  filesStatutMaroc: File[];
  
  // Files - Étranger
  filesAttestationAT: File[];
  filesAttestationRC_Etranger: File[];
  filesAttestationRIB_Etranger: File[];
  filesICE_Etranger: File[];
  
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
  filesStatutMaroc: [],
  filesAttestationAT: [],
  filesAttestationRC_Etranger: [],
  filesAttestationRIB_Etranger: [],
  filesICE_Etranger: [],
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