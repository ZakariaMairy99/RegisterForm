
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
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 animate-fade-in-up">
      <div className="mb-8 pb-4 border-b border-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">Contact principal</h2>
        <p className="text-sm text-gray-500 mt-1">Personne à contacter pour la gestion du compte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
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
          label="Téléphone personnel" 
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
          options={[
            {value: 'FR', label: 'Français'}, 
            {value: 'EN', label: 'Anglais'},
            {value: 'AR', label: 'Arabe'}
          ]}
          value={data.language}
          onChange={e => update('language', e.target.value)}
        />
        <div className="md:col-span-2">
          <Select 
            label="Fuseau horaire" 
            options={[
              {value: 'WET - Western European Time', label: 'WET - Western European Time (Africa/Casablanca)'}
            ]}
            value={data.timezone}
            onChange={e => update('timezone', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
