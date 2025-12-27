import { useState, useEffect, useRef } from 'react';
import { SupplierFormData, INITIAL_DATA, STEPS } from '../types';

const STORAGE_KEY = 'supplierFormState';

// File upload security settings (client-side)
const MAX_FILE_SIZE = Number(import.meta.env.VITE_MAX_UPLOAD_BYTES) || 5 * 1024 * 1024; // 5 MB default
// Allowed file types client-side (match backend permissive list)
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.tiff'];
const ALLOWED_MIME_PREFIXES = ['application/', 'image/', 'text/'];

// Load saved state from localStorage
const loadSavedState = (): { formData: SupplierFormData; currentStep: number } | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with INITIAL_DATA to ensure all file fields are initialized as arrays
      const mergedFormData = { ...INITIAL_DATA, ...parsed.formData };
      return { formData: mergedFormData, currentStep: parsed.currentStep };
    }
  } catch (error) {
    // ignore load errors
  }
  return null;
};

// Save state to localStorage
const saveStateToStorage = (formData: SupplierFormData, currentStep: number) => {
  try {
    // Avoid storing actual File objects in localStorage (not serializable). Store file metadata counts instead.
    const safeFormData = { ...formData } as any;
    safeFormData.filesAttestationRC = [];
    safeFormData.filesAttestationRIB = [];
    safeFormData.filesAttestationTVA = [];
    safeFormData.filesICE = [];
    safeFormData.filesIdentifiantFiscal = [];
    safeFormData.filesPresentationCommerciale = [];
    safeFormData.filesStatutMaroc = [];
    safeFormData.filesAttestationAT = [];
    safeFormData.filesAttestationRC_Etranger = [];
    safeFormData.filesAttestationRIB_Etranger = [];
    safeFormData.filesICE_Etranger = [];

    const state = { formData: safeFormData, currentStep, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // ignore save errors
  }
};

// Clear saved state
const clearSavedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // ignore clear errors
  }
};

export const useSupplierForm = () => {
    const savedState = loadSavedState();
    const [currentStep, setCurrentStep] = useState(savedState?.currentStep || 0);
  const [formData, setFormData] = useState<SupplierFormData>(savedState?.formData || INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(savedState?.formData?.logoUrl || null);
  const [logoName, setLogoName] = useState<string | null>(savedState?.formData?.logoName || null);
  const [logoDeveloper, setLogoDeveloper] = useState<string | null>(savedState?.formData?.logoDeveloper || null);
    // Track whether the form has been explicitly saved by the user
    const [isSaved, setIsSaved] = useState<boolean>(false);
    // Track file validation errors by category (keys match formData file arrays)
    const [fileErrors, setFileErrors] = useState<Record<string, string[]>>({});
    // Submission feedback (replaces alert popups)
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitWarnings, setSubmitWarnings] = useState<string[] | null>(null);
    // Field-level validation errors to display inline
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Abort controllers for fetches (logo fetch, submission)
    const logoFetchController = useRef<AbortController | null>(null);
    const submitController = useRef<AbortController | null>(null);

    // Auto-save form data whenever it changes
    useEffect(() => {
      if (currentStep < STEPS.length - 1) { // Don't save on confirmation step
        saveStateToStorage(formData, currentStep);
      }
    }, [formData, currentStep]);

    // Validate a single File object against client-side policy
    const validateFile = (f: File) => {
      if (!f) return 'Invalid file';
      if (typeof f.size !== 'number' || typeof f.name !== 'string') return 'Not a valid file';
      if (f.size > MAX_FILE_SIZE) return `File too large (max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB)`;
      const lower = f.name.toLowerCase();
      const hasAllowedExt = ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext));
      const mimeOk = typeof f.type === 'string' && ALLOWED_MIME_PREFIXES.some(p => f.type.startsWith(p));
      if (!hasAllowedExt && !mimeOk) return 'File type not allowed';
      // prevent uploading suspicious filenames
      if (/\.(exe|sh|bat|cmd|js|jar|msi)$/i.test(lower)) return 'Executable files are not allowed';
      return null;
    };

    // Add files to a named category on formData, validating each before adding
    const addFilesToCategory = (category: string, files: FileList | File[]) => {
      const arr = Array.from(files as any) as File[];
      const errs: string[] = [];
      const accepted: File[] = [];
      for (const f of arr) {
        const e = validateFile(f);
        if (e) errs.push(`${f.name}: ${e}`);
        else accepted.push(f);
      }
      if (errs.length) {
        setFileErrors(prev => ({ ...prev, [category]: errs }));
        // do not add invalid files
      }
      if (accepted.length) {
        setFormData(prev => ({ ...prev, [category]: ([...((prev as any)[category] || []), ...accepted]) }));
        // any change should clear saved state
        setIsSaved(false);
        // clear previous errors for this category if we added files
        setFileErrors(prev => {
          const copy = { ...prev } as Record<string, string[]>;
          delete copy[category];
          return copy;
        });
      }
    };

    const removeFileFromCategory = (category: string, index: number) => {
      setFormData(prev => {
        const copy = { ...(prev as any) } as any;
        const arr = Array.isArray(copy[category]) ? [...copy[category]] : [];
        arr.splice(index, 1);
        copy[category] = arr;
        return copy as SupplierFormData;
      });
      setIsSaved(false);
    };

    // Fetch metadata logo from backend on mount
    useEffect(() => {
      const fetchLogo = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL;
          if (!apiUrl) return;
          // Abort previous logo fetch if any
          if (logoFetchController.current) logoFetchController.current.abort();
          logoFetchController.current = new AbortController();
          const resp = await fetch(`${apiUrl}/api/metadata/logo`, { signal: logoFetchController.current.signal });
          if (!resp.ok) {
            return;
          }
          const data = await resp.json();
          if (data) {
            if (data.logoUrl) {
              setLogoUrl(data.logoUrl);
            }
            if (data.logoName) {
              setLogoName(data.logoName);
            }
            if (data.developerName) {
              setLogoDeveloper(data.developerName);
            }
            // Also save into formData so components can access it from the same object
            setFormData(prev => ({ ...prev, logoUrl: data.logoUrl || prev.logoUrl, logoName: data.logoName || prev.logoName, logoDeveloper: data.developerName || prev.logoDeveloper }));
          }
        } catch (err) {
          // ignore fetch errors / aborts
        }
      };

      fetchLogo();

      return () => {
        if (logoFetchController.current) {
          logoFetchController.current.abort();
          logoFetchController.current = null;
        }
      };
    }, []);

    const updateField = (field: keyof SupplierFormData, value: any) => {
      // Any change to a form field should clear the "saved" state
      setIsSaved(false);
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const saveProgress = () => {
      saveStateToStorage(formData, currentStep);
      // Mark as saved so UI can show feedback
      setIsSaved(true);
    };

    // Validate a specific step and return a map of field -> error message
    const validateStep = (stepIndex: number): Record<string, string> => {
      const errs: Record<string, string> = {};
      if (stepIndex === 0) {
        // Organization - required fields (those with asterisks)
        if (!formData.raisonSociale || formData.raisonSociale.trim() === '') errs.raisonSociale = 'Raison sociale est requise';
        if (!formData.formeJuridique || formData.formeJuridique.trim() === '') errs.formeJuridique = 'Forme juridique est requise';
        // If user selected 'AUTRE', require the custom text
        if (formData.formeJuridique === 'AUTRE' && (!formData.formeJuridiqueAutre || formData.formeJuridiqueAutre.trim() === '')) errs.formeJuridiqueAutre = 'Veuillez préciser la forme juridique';
        if (!formData.address || formData.address.trim() === '') errs.address = 'Adresse est requise';
        if (!formData.postalCode || formData.postalCode.trim() === '') errs.postalCode = 'Code postal est requis';
        if (!formData.city || formData.city.trim() === '') errs.city = 'Ville est requise';
        if (!formData.emailEntreprise || formData.emailEntreprise.trim() === '') errs.emailEntreprise = 'Email entreprise est requis';
      } else if (stepIndex === 1) {
        // Contact - only 4 required fields (those with asterisks)
        if (!formData.civility || formData.civility.trim() === '') errs.civility = 'Civilité est requise';
        if (!formData.contactNom || formData.contactNom.trim() === '') errs.contactNom = 'Nom du contact est requis';
        if (!formData.contactPrenom || formData.contactPrenom.trim() === '') errs.contactPrenom = 'Prénom du contact est requis';
        if (!formData.email || formData.email.trim() === '') errs.email = "Email principal est requis";
      } else if (stepIndex === 2) {
        // Step 3 documents - all fields are now optional
      }
      return errs;
    };

    // Sanitize server messages on the client to avoid exposing IDs or API names
    const sanitizeClientMessage = (raw: any) => {
      if (!raw) return raw;
      let s = String(raw);
      if (/duplicate/i.test(s)) return 'Doublon détecté : une valeur identique existe déjà.';
      // remove 15/18 char IDs
      s = s.replace(/\b[0-9A-Za-z]{15,18}\b/g, '[id supprimé]');
      // replace API names like SomeField__c with placeholder
      s = s.replace(/\b[A-Za-z0-9_]+__(?:c|r)\b/g, '[champ supprimé]');
      // remove common object names
      s = s.replace(/\b(Account|Contact|ContentVersion|ContentDocument|ContentDocumentLink|RecordType)\b/g, '[objet]');
      // collapse whitespace
      s = s.replace(/\s+/g, ' ').trim();
      return s;
    };

    const validateAll = (): Record<string, string> => {
      const all: Record<string, string> = {};
      for (let i = 0; i <= 2; i++) {
        Object.assign(all, validateStep(i));
      }
      return all;
    };

    const goToNextStep = () => {
      // validate current step before advancing
      const errs = validateStep(currentStep);
      if (Object.keys(errs).length > 0) {
        setValidationErrors(errs);
        // scroll to top so user sees messages
        scrollToTop();
        return;
      }
      // clear any previous validation errors for this step
      setValidationErrors(prev => {
        const copy = { ...prev };
        Object.keys(errs).forEach(k => delete copy[k]);
        return copy;
      });
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(curr => curr + 1);
        scrollToTop();
      }
    };

    const goToPrevStep = () => {
      if (currentStep > 0) {
        setCurrentStep(curr => curr - 1);
        scrollToTop();
      }
    };

    const goToStep = (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < STEPS.length) {
        setCurrentStep(stepIndex);
        scrollToTop();
      }
    };

    const resetForm = () => {
      setFormData(INITIAL_DATA);
      setCurrentStep(0);
      setIsSubmitting(false);
      clearSavedState();
      setIsSaved(false);
      scrollToTop();
    };

    const submitForm = async () => {
      setIsSubmitting(true);
      // Clear previous feedback
      setSubmitError(null);
      setSubmitWarnings(null);
      setValidationErrors({});
      try {
        // Get API URL from environment
        const apiUrl = import.meta.env.VITE_API_URL;
        
        // Basic validation: ensure ICE is numeric <=18 digits and SIRET <=14 chars
        let normalizedIce = formData.ice;
        if (formData.ice) {
          const digitsOnly = String(formData.ice).replace(/\D/g, '');
          if (digitsOnly.length > 18) {
            setIsSubmitting(false);
            return;
          }
          if (digitsOnly !== String(formData.ice)) {
            // normalize the value before submitting
            normalizedIce = digitsOnly;
            // update saved state so user sees normalized value on next load
            setFormData(prev => ({ ...prev, ice: digitsOnly }));
          }
        }

        const normalizedSiret = formData.siret ? String(formData.siret).slice(0, 14) : formData.siret;
        if (formData.siret && String(formData.siret).length > 14) {
          setFormData(prev => ({ ...prev, siret: normalizedSiret }));
        }

        // Ensure nomCommercial fits Salesforce max length (20)
        const normalizedNomCommercial = formData.nomCommercial ? String(formData.nomCommercial).slice(0, 20) : formData.nomCommercial;
        if (formData.nomCommercial && String(formData.nomCommercial).length > 20) {
          setFormData(prev => ({ ...prev, nomCommercial: normalizedNomCommercial }));
        }

        // If user selected 'AUTRE' for legal form, use the custom value as the effective legal form
        const effectiveFormeJuridique = formData.formeJuridique === 'AUTRE'
          ? (formData.formeJuridiqueAutre && formData.formeJuridiqueAutre.trim() !== '' ? formData.formeJuridiqueAutre : 'AUTRE')
          : formData.formeJuridique;

        // Validate entire form before sending
        const allErrs = validateAll();
        if (Object.keys(allErrs).length > 0) {
          setValidationErrors(allErrs);
          setSubmitError('Veuillez corriger les champs requis avant de soumettre.');
          setIsSubmitting(false);
          return;
        }

        // Prepare complete payload with all form data (exclude non-applicable fields by country)
        const payload: any = {
          // Account data (common)
          raisonSociale: formData.raisonSociale,
          nomCommercial: normalizedNomCommercial,
          formeJuridique: effectiveFormeJuridique,
          formeJuridiqueAutre: formData.formeJuridiqueAutre,
          address: formData.address,
          postalCode: formData.postalCode,
          city: formData.city,
          country: formData.country,
          phone: formData.phone,
          fax: formData.fax,
          website: formData.website,
          emailEntreprise: formData.emailEntreprise,

          // Documents
          dateCreation: formData.dateCreation,
          typeEntreprise: formData.typeEntreprise,
          effectifTotal: formData.effectifTotal,
          effectifEncadrement: formData.effectifEncadrement,
          exercicesClos: formData.exercicesClos,
          certifications: formData.certifications,
          hsePolicy: formData.hsePolicy,

          // Contact data
          civility: formData.civility,
          contactNom: formData.contactNom,
          contactPrenom: formData.contactPrenom,
          email: formData.email,
          contactMobile: formData.contactMobile,
          faxPro: formData.faxPro,
          otherPhone: formData.otherPhone,
          language: formData.language,
          timezone: formData.timezone,

          // Files metadata (file upload would need separate handling)
          files: {
            // Maroc files
            attestationRC: formData.filesAttestationRC.length,
            attestationRIB: formData.filesAttestationRIB.length,
            attestationTVA: formData.filesAttestationTVA.length,
            ice: formData.filesICE.length,
            identifiantFiscal: formData.filesIdentifiantFiscal.length,
            presentationCommerciale: formData.filesPresentationCommerciale.length,
            statutMaroc: formData.filesStatutMaroc.length,
            // Étranger files
            attestationAT: formData.filesAttestationAT.length,
            attestationRC_Etranger: formData.filesAttestationRC_Etranger.length,
            attestationRIB_Etranger: formData.filesAttestationRIB_Etranger.length,
            ice_Etranger: formData.filesICE_Etranger.length
          }
        };

        // Attach only country-relevant identifier fields
        if (formData.country === 'MAROC') {
          payload.ice = normalizedIce;
          payload.rc = formData.rc;
          payload.identifiantFiscal = formData.identifiantFiscal;
        } else if (formData.country === 'ETRANGER') {
          payload.siret = normalizedSiret;
          payload.tva = formData.tva;
        }

        

        // If there are files, validate them client-side then send as multipart/form-data; otherwise send JSON
        const totalFiles = (formData.filesAttestationRC?.length || 0) + (formData.filesAttestationRIB?.length || 0) + (formData.filesAttestationTVA?.length || 0) + (formData.filesICE?.length || 0) + (formData.filesIdentifiantFiscal?.length || 0) + (formData.filesPresentationCommerciale?.length || 0) + (formData.filesStatutMaroc?.length || 0) + (formData.filesAttestationAT?.length || 0) + (formData.filesAttestationRC_Etranger?.length || 0) + (formData.filesAttestationRIB_Etranger?.length || 0) + (formData.filesICE_Etranger?.length || 0);
        // Pre-validate files across categories to avoid uploading disallowed files
        const categories = [
          ['filesAttestationRC', formData.filesAttestationRC],
          ['filesAttestationRIB', formData.filesAttestationRIB],
          ['filesAttestationTVA', formData.filesAttestationTVA],
          ['filesICE', formData.filesICE],
          ['filesIdentifiantFiscal', formData.filesIdentifiantFiscal],
          ['filesPresentationCommerciale', formData.filesPresentationCommerciale],
          ['filesStatutMaroc', formData.filesStatutMaroc],
          ['filesAttestationAT', formData.filesAttestationAT],
          ['filesAttestationRC_Etranger', formData.filesAttestationRC_Etranger],
          ['filesAttestationRIB_Etranger', formData.filesAttestationRIB_Etranger],
          ['filesICE_Etranger', formData.filesICE_Etranger]
        ] as Array<[string, any]>;

        const allErrors: Record<string, string[]> = {};
        for (const [cat, arr] of categories) {
          if (!arr || !Array.isArray(arr)) continue;
          for (const f of arr) {
            if (f && typeof (f as any).name === 'string' && typeof (f as any).size === 'number') {
              const e = validateFile(f as File);
              if (e) {
                allErrors[cat] = allErrors[cat] || [];
                allErrors[cat].push(`${(f as any).name}: ${e}`);
              }
            }
          }
        }
        if (Object.keys(allErrors).length > 0) {
          // Surface validation problems to the UI and abort submission
          setFileErrors(allErrors);
          setIsSubmitting(false);
          return;
        }

        let resp: Response;
        if (totalFiles > 0) {
          const form = new FormData();
          // Append scalar fields
          Object.entries({
            raisonSociale: formData.raisonSociale,
            nomCommercial: normalizedNomCommercial,
            formeJuridique: effectiveFormeJuridique,
            formeJuridiqueAutre: formData.formeJuridiqueAutre,
            address: formData.address,
            postalCode: formData.postalCode,
            city: formData.city,
            country: formData.country,
            phone: formData.phone,
            fax: formData.fax,
            website: formData.website,
            emailEntreprise: formData.emailEntreprise,
            dateCreation: formData.dateCreation,
            typeEntreprise: formData.typeEntreprise,
            effectifTotal: formData.effectifTotal,
            effectifEncadrement: formData.effectifEncadrement,
            exercicesClos: formData.exercicesClos,
            certifications: (formData.certifications || []).join(';'),
            hsePolicy: formData.hsePolicy,
            civility: formData.civility,
            contactNom: formData.contactNom,
            contactPrenom: formData.contactPrenom,
            email: formData.email,
            contactMobile: formData.contactMobile,
            faxPro: formData.faxPro,
            otherPhone: formData.otherPhone,
            language: formData.language,
            timezone: formData.timezone
          }).forEach(([k, v]) => {
            if (v !== undefined && v !== null) form.append(k, String(v));
          });

          // Append country-specific identifier fields
          if (formData.country === 'MAROC') {
            form.append('ice', String(normalizedIce || ''));
            form.append('rc', String(formData.rc || ''));
            form.append('identifiantFiscal', String(formData.identifiantFiscal || ''));
          } else if (formData.country === 'ETRANGER') {
            form.append('siret', String(normalizedSiret || ''));
            form.append('tva', String(formData.tva || ''));
          }

          // Append files from each category
          const appendFiles = (arr: File[] | undefined, fieldName = 'files', sectionLabel = '') => {
            if (!arr) return;
            // Build supplier abbreviation (use nomCommercial or raisonSociale)
            const supplierName = normalizedNomCommercial || formData.raisonSociale || 'fournisseur';
            const supplierAbbrev = String(supplierName)
              .toUpperCase()
              .replace(/[^A-Z0-9]/gi, '')
              .slice(0, 8) || 'FOURN';

            for (const f of arr) {
              // Only append real File-like objects — guard against saved metadata objects from localStorage
              const isFileLike = f && typeof (f as any).name === 'string' && typeof (f as any).size === 'number';
              if (isFileLike) {
                // Build type label from the section label and use it as the filename (uppercase, no original name)
                // e.g. sectionLabel 'associes' => 'ASSOCIES.pdf'
                    const typeLabel = sectionLabel ? String(sectionLabel) : 'FILE';
                // Include original file extension when sending to backend — e.g. 'ICE.pdf'
                const originalName = (f as any).name || '';
                const extMatch = originalName.match(/\.[^\.]+$/);
                const ext = extMatch ? extMatch[0].toLowerCase() : '.pdf';
                    // Do NOT include the supplier name in the sent filename — keep the original filename simple
                    // Backend will construct the final Title as TYPE(company). This avoids duplicate company parts.
                    const newFilename = `${typeLabel}${ext}`;
                form.append(fieldName, f as any, newFilename);
              } else {
                // skip non-file entries silently
              }
            }
          };

          // Use French section names for uploaded filenames - Maroc files
          appendFiles(formData.filesAttestationRC, 'files', 'Attestation RC');
          appendFiles(formData.filesAttestationRIB, 'files', 'Attestation RIB');
          appendFiles(formData.filesAttestationTVA, 'files', 'Attestation TVA');
          appendFiles(formData.filesICE, 'files', 'ICE');
          appendFiles(formData.filesIdentifiantFiscal, 'files', 'Identifiant Fiscal');
          appendFiles(formData.filesPresentationCommerciale, 'files', 'Présentation Commerciale');
          appendFiles(formData.filesStatutMaroc, 'files', 'Statut');
          // Étranger files
          appendFiles(formData.filesAttestationAT, 'files', "Attestation d'assurance (AT)");
          appendFiles(formData.filesAttestationRC_Etranger, 'files', "Attestation d'assurance (RC)");
          appendFiles(formData.filesAttestationRIB_Etranger, 'files', 'Attestation RIB');
          appendFiles(formData.filesICE_Etranger, 'files', 'ICE');

          // Log files being sent
          console.log('📎 Fichiers à envoyer:', {
            attestationRC: formData.filesAttestationRC.length,
            attestationRIB: formData.filesAttestationRIB.length,
            attestationTVA: formData.filesAttestationTVA.length,
            ice: formData.filesICE.length,
            identifiantFiscal: formData.filesIdentifiantFiscal.length,
            presentationCommerciale: formData.filesPresentationCommerciale.length,
            statutMaroc: formData.filesStatutMaroc.length,
            attestationAT: formData.filesAttestationAT.length,
            attestationRC_Etranger: formData.filesAttestationRC_Etranger.length,
            attestationRIB_Etranger: formData.filesAttestationRIB_Etranger.length,
            ice_Etranger: formData.filesICE_Etranger.length,
            totalFiles: totalFiles
          });

          // create abort controller for submission
          if (submitController.current) submitController.current.abort();
          submitController.current = new AbortController();
          resp = await fetch(`${apiUrl}/api/supplier`, {
            method: 'POST',
            // NOTE: do NOT set Content-Type; browser will set the multipart boundary
            body: form,
            signal: submitController.current.signal
          });
        } else {
          // Send JSON when no files
          if (submitController.current) submitController.current.abort();
          submitController.current = new AbortController();
          resp = await fetch(`${apiUrl}/api/supplier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: submitController.current.signal
          });
        }

        let result: any = null;
        try {
          result = await resp.json();
        } catch (e) {
          console.warn('Failed to parse JSON response from /api/supplier', e);
        }

        console.debug('Submission response', resp.status, result);

        if (!resp.ok) {
          // Special handling for duplicate-field structured response (409)
          if (resp.status === 409 && result && Array.isArray(result.duplicates)) {
            // Build validationErrors map from duplicates array
            const vErrs: Record<string, string> = {};
            for (const d of result.duplicates) {
              // d: { field: 'raisonSociale' | null, label: 'Nom fournisseur', message: 'Valeur dupliquée' }
              if (d.field) vErrs[d.field] = d.message || 'Valeur dupliquée';
              else if (d.label) {
                // try to map label to known keys
                if (/nom fournisseur/i.test(d.label)) vErrs['raisonSociale'] = d.message || 'Valeur dupliquée';
                else if (/nom commercial/i.test(d.label)) vErrs['nomCommercial'] = d.message || 'Valeur dupliquée';
              }
            }
            setValidationErrors(vErrs);
            setSubmitError(result.error || 'Doublon détecté');
            setIsSubmitting(false);
            return;
          }
          // Check if authentication is required
          if (resp.status === 401 && result.loginUrl) {
            const shouldLogin = window.confirm(
              'Backend is not authenticated with Salesforce.\n\n' +
              'Would you like to login now?\n\n' +
              '(This will open a new window for Salesforce login)'
            );
            if (shouldLogin) {
              window.open(result.loginUrl, '_blank');
            }
            } else {
              // Show error message via state instead of blocking alert
              const errMsg = result && result.error ? result.error : 'Failed to create supplier';
              const safeRaw = sanitizeClientMessage(errMsg);
              // Only show actionable messages to users: duplicates or validation-related messages.
              const isDuplicate = /doublon|duplicate|valeur dupli/i.test(String(safeRaw).toLowerCase());
              const isValidation = Object.keys(validationErrors || {}).length > 0;
              if (isDuplicate || isValidation) {
                console.warn('Submission error (actionable):', safeRaw);
                setSubmitError(safeRaw);
              } else {
                // Hide sensitive/internal details from users; log full info for dev debugging
                console.error('Submission error (hidden from UI):', errMsg, result);
                setSubmitError('Une erreur inattendue est survenue. Veuillez contacter l\'administrateur.');
              }
            }
            return;
        }
        
        // Check for warnings even if successful
        if (result.warnings && result.warnings.length > 0) {
          // Store warnings in state so UI can display them without blocking
          const safeWarnings = (result.warnings || []).map((w: any) => sanitizeClientMessage(w));
          console.warn('Submission warnings:', safeWarnings);
          setSubmitWarnings(safeWarnings);
          // Don't advance to confirmation if there are warnings - let user review and fix
          return;
        }
        
        // Success - show what was created
        const successMsg = `✅ Supplier created successfully!\n\n` +
          `Account ID: ${result.data?.accountId || 'N/A'}\n` +
          (result.data?.contactLinked ? `Contact ID: ${result.data?.contactId}\n` : '⚠️ Contact not linked\n') +
          (result.data?.uploadedFiles?.length > 0 ? `Files uploaded: ${result.data.uploadedFiles.length}` : '');
        console.log(successMsg);
        
        // Clear saved state after successful submission
        clearSavedState();
        
        // Move to confirmation step
        setCurrentStep(STEPS.length - 1);
        scrollToTop();
      } catch (err) {
        console.error('Network or unexpected error during submission:', err);
        const msg = err && (err.message || err.toString) ? sanitizeClientMessage(err.message || err.toString()) : 'Erreur réseau lors de l\'envoi';
        setSubmitError(msg);
      } finally {
        setIsSubmitting(false);
        if (submitController.current) {
          submitController.current = null;
        }
      }
    };

    const scrollToTop = () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.scrollTop = 0;
    };

    return {
      currentStep,
      formData,
      logoUrl,
      logoName,
      logoDeveloper,
      isSaved,
      isSubmitting,
      updateField,
      goToNextStep,
      goToPrevStep,
      goToStep,
      resetForm,
      submitForm,
      saveProgress,
      // File helpers and validation info
      addFilesToCategory,
      removeFileFromCategory,
      fileErrors,
      submitError,
      submitWarnings,
      validationErrors,
      isLastStep: currentStep === STEPS.length - 2, // -2 car la dernière étape est la confirmation (hors form)
      isConfirmationStep: currentStep === STEPS.length - 1
    };
};