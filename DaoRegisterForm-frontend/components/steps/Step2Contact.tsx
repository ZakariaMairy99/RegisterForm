
import React from 'react';
import { Input, Select } from '../FormComponents';
import { SupplierFormData } from '../../types';

interface StepProps {
  data: SupplierFormData;
  update: (field: keyof SupplierFormData, value: any) => void;
  errors?: Record<string, string>;
}

export const Step2Contact: React.FC<StepProps> = ({ data, update, errors }) => {
  return (
    <div className="animate-fade-in bg-app-surface p-6 md:p-8 rounded-2xl shadow-sm border border-app-border">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-main">Contact principal de l’entreprise</h2>
        <p className="text-xs text-text-muted mt-0.5">Personne à contacter pour la gestion du compte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        <Select 
          label="Civilité" 
          required 
          showRequiredIndicator={true}
          options={[{value: 'M.', label: 'M.'}, {value: 'Mme.', label: 'Mme.'}]}
          value={data.civility}
          onChange={e => update('civility', e.target.value)}
          error={errors?.civility}
        />
        <Input 
          label="Nom" 
          required 
          showRequiredIndicator={true}
          value={data.contactNom}
          onChange={e => update('contactNom', e.target.value)}
          error={errors?.contactNom}
        />
        <Input 
          label="Prénom" 
          required 
          showRequiredIndicator={true}
          value={data.contactPrenom}
          onChange={e => update('contactPrenom', e.target.value)}
          error={errors?.contactPrenom}
        />
        <Input 
          label="Téléphone mobile" 
          type="tel"
          value={data.contactMobile}
          onChange={e => update('contactMobile', e.target.value)}
        />
        <Input 
          label="Téléphone professionnel" 
          type="tel"
          value={data.otherPhone}
          onChange={e => update('otherPhone', e.target.value)}
        />
        <Input 
          label="Adresse e-mail principale" 
          required 
          showRequiredIndicator={true}
          type="email"
          helperText="IMPORTANT : Cette adresse e-mail doit être identique à celle indiquée dans la désignation officielle."
          value={data.email}
          onChange={e => update('email', e.target.value)}
          error={errors?.email}
        />
        <Select 
          label="Choix de la langue" 
          options={[{value: 'fr', label: 'Français'}, {value: 'en', label: 'Anglais'}]}
          value={data.language}
          onChange={e => update('language', e.target.value)}
        />
        <div className="md:col-span-2">
          <Select 
            label="Fuseau horaire" 
            options={[{value: 'WET', label: 'WET - Western European Time (Africa/Casablanca)'}]}
            value={data.timezone}
            onChange={e => update('timezone', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
