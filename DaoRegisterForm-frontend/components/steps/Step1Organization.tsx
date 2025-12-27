
import React from 'react';
import { Input, Select } from '../FormComponents';
import { SupplierFormData } from '../../types';

interface StepProps {
  data: SupplierFormData;
  update: (field: keyof SupplierFormData, value: any) => void;
  errors?: Record<string, string>;
}

export const Step1Organization: React.FC<StepProps> = ({ data, update, errors }) => {
  // Conditional field visibility based on country
  const showIce = data.country === 'MAROC';
  const showTvaAndSiret = data.country === 'ETRANGER';
  
  return (
    <div className="animate-fade-in bg-app-surface p-6 md:p-8 rounded-2xl shadow-sm border border-app-border">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-main">Données entreprise</h2>
        <p className="text-xs text-text-muted mt-0.5">Informations générales et légales de la structure.</p>
      </div>
      
      {/* Main Company Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-5">
        <Input 
          label="Raison sociale" 
          required
          showRequiredIndicator={true}
          value={data.raisonSociale}
          onChange={e => update('raisonSociale', e.target.value)}
          error={errors?.raisonSociale}
        />
        
        <Input 
          label="Nom Commercial" 
          value={data.nomCommercial}
          // Limit Nom Commercial to 20 characters (Salesforce max length = 20)
          onChange={e => {
            const raw = e.target.value || '';
            update('nomCommercial', raw.slice(0, 20));
          }}
          maxLength={20}
        />
        <Select 
          label="Forme juridique" 
          required
          showRequiredIndicator={true}
          options={[
            {value: 'SA', label: 'SA – Société Anonyme'},
            {value: 'SAS', label: 'SAS – Société Anonyme Simplifiée'},
            {value: 'SARL', label: 'SARL – Société à Responsabilité Limitée'},
            {value: 'SNC', label: 'SNC – Société en Nom Collectif'},
            {value: 'SCS', label: 'SCS – Société en Commandite Simple'},
            {value: 'SCA', label: 'S.C.A – Société en Commandite par Actions'},
            {value: 'EI', label: 'Entreprise individuelle'},
            {value: 'AUTRE', label: 'Autre forme juridique'}
          ]}
          value={data.formeJuridique}
          onChange={e => update('formeJuridique', e.target.value)}
          error={errors?.formeJuridique}
        />
        {data.formeJuridique === 'AUTRE' && (
          <Input
            label="Précisez la forme juridique"
            value={data.formeJuridiqueAutre}
            onChange={e => update('formeJuridiqueAutre', e.target.value)}
            maxLength={255}
            error={errors?.formeJuridiqueAutre}
          />
        )}
      </div>

      {/* Country Section */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
          <Select 
            label="Pays" 
            options={[{value: 'MAROC', label: 'MAROC'}, {value: 'ETRANGER', label: 'Étranger'}]}
            value={data.country}
            onChange={e => update('country', e.target.value)}
          />
          {showIce && (
            <>
            <Input 
              label="ICE" 
              value={data.ice}
              // Only allow digits and limit to 18 characters (Number(18,0) in Salesforce)
              onChange={e => {
                const raw = e.target.value || '';
                const digits = raw.replace(/\D/g, '').slice(0, 18);
                update('ice', digits);
              }}
              maxLength={18}
              inputMode="numeric"
              pattern="\\d*"
            />
            <Input 
              label="Numéro de registre du commerce" 
              value={data.rc}
              onChange={e => update('rc', e.target.value)}
              maxLength={255}
            />
            </>
          )}
          {showIce && (
            <Input
              label="Identifiant fiscal"
              value={data.identifiantFiscal}
              onChange={e => update('identifiantFiscal', e.target.value)}
              maxLength={255}
              error={errors?.identifiantFiscal}
            />
          )}
          {showTvaAndSiret && (
            <Input 
              label="SIRET" 
              value={data.siret}
              // SIRET is text but limited to 14 characters
              onChange={e => {
                const raw = e.target.value || '';
                update('siret', raw.slice(0, 14));
              }}
              maxLength={14}
            />
          )}
          {showTvaAndSiret && (
            <Input 
              label="TVA intracommunautaire" 
              value={data.tva}
              onChange={e => update('tva', e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Address Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        <Input 
          label="Adresse" 
          required
          showRequiredIndicator={true}
          value={data.address}
          onChange={e => update('address', e.target.value)}
          error={errors?.address}
        />
        <Input 
          label="Code Postal" 
          required
          showRequiredIndicator={true}
          value={data.postalCode}
          onChange={e => update('postalCode', e.target.value)}
          error={errors?.postalCode}
        />
        <Input 
          label="Ville" 
          required
          showRequiredIndicator={true}
          value={data.city}
          onChange={e => update('city', e.target.value)}
          error={errors?.city}
        />
        <Input 
          label="Téléphone" 
          type="tel"
          value={data.phone}
          onChange={e => update('phone', e.target.value)}
          error={errors?.phone}
        />
        <Input 
          label="Fax pro" 
          type="tel"
          value={data.fax}
          onChange={e => update('fax', e.target.value)}
        />
        <Input 
          label="Site web" 
          type="url"
          helperText="si vous disposez d'un site web professionnel"
          value={data.website}
          onChange={e => update('website', e.target.value)}
        />
        <Input 
          label="Email entreprise" 
          required
          showRequiredIndicator={true}
          type="email"
          helperText="Email de contact principal de l'entreprise"
          value={data.emailEntreprise}
          onChange={e => update('emailEntreprise', e.target.value)}
          error={errors?.emailEntreprise}
        />
      </div>
    </div>
  );
};
