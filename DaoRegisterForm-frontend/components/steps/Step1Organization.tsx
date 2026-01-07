
import React from 'react';
import { Input, Select } from '../FormComponents';
import { SupplierFormData } from '../../types';
import { COUNTRIES } from '../countries';

interface StepProps {
  data: SupplierFormData;
  update: (field: keyof SupplierFormData, value: any) => void;
  errors?: Record<string, string>;
}

export const Step1Organization: React.FC<StepProps> = ({ data, update, errors }) => {
  // Conditional field visibility based on country
  const isMaroc = data.country === 'MA';
  const isFrance = data.country === 'France';
  const isOther = !isMaroc && !isFrance && !!data.country;
  
  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 animate-fade-in-up">
      <div className="mb-8 pb-4 border-b border-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">Données entreprise</h2>
        <p className="text-sm text-gray-500 mt-1">Informations générales et légales de la structure.</p>
      </div>
      
      {/* Main Company Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
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
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Select 
            label="Pays" 
            options={COUNTRIES}
            value={data.country}
            onChange={e => {
              const newCountry = e.target.value;
              update('country', newCountry);
              
              // Clear fields based on selection
              if (newCountry === 'MA') {
                update('siret', '');
                update('tva', '');
                update('identifiantFiscal1', '');
                update('identifiantFiscal2', '');
              } else if (newCountry === 'France') {
                update('ice', '');
                update('rc', '');
                update('identifiantFiscal', '');
                update('identifiantFiscal1', '');
                update('identifiantFiscal2', '');
              } else {
                update('ice', '');
                update('rc', '');
                update('identifiantFiscal', '');
                update('siret', '');
                update('tva', '');
              }
            }}
          />
          {isMaroc && (
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
            <Input
              label="Identifiant fiscal"
              value={data.identifiantFiscal}
              onChange={e => update('identifiantFiscal', e.target.value)}
              maxLength={255}
              error={errors?.identifiantFiscal}
            />
            </>
          )}
          
          {isFrance && (
            <>
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
            <Input 
              label="TVA intracommunautaire" 
              value={data.tva}
              onChange={e => update('tva', e.target.value)}
            />
            </>
          )}

          {isOther && (
            <>
            <Input 
              label="Identifiant fiscal 1" 
              value={data.identifiantFiscal1}
              onChange={e => update('identifiantFiscal1', e.target.value)}
              maxLength={255}
            />
            <Input 
              label="Identifiant fiscal 2" 
              value={data.identifiantFiscal2}
              onChange={e => update('identifiantFiscal2', e.target.value)}
              maxLength={255}
            />
            </>
          )}
        </div>
      </div>

      {/* Address Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
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
