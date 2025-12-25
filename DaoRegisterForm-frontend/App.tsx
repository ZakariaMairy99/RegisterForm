
import React from 'react';
import { Layout } from './components/Layout';
import { useSupplierForm } from './hooks/useSupplierForm';
import { Step1Organization } from './components/steps/Step1Organization';
import { Step2Contact } from './components/steps/Step2Contact';
import { Step3Documents } from './components/steps/Step3Documents';
import { Step4Recap } from './components/steps/Step4Recap';
import { Step5Confirmation } from './components/steps/Step5Confirmation';

function App() {
  const { 
    currentStep, 
    formData, 
    logoUrl,
    logoName,
    updateField, 
    isSaved,
    isSubmitting, 
    goToNextStep, 
    goToPrevStep, 
    submitForm, 
    resetForm,
    goToStep,
    isLastStep,
    isConfirmationStep,
    validationErrors,
    submitError,
    submitWarnings,
    fileErrors,
    saveProgress
  } = useSupplierForm();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Organization data={formData} update={updateField} errors={validationErrors} />;
      case 1:
        return <Step2Contact data={formData} update={updateField} errors={validationErrors} />;
      case 2:
        return <Step3Documents data={formData} update={updateField} errors={validationErrors} />;
      case 3:
        return <Step4Recap data={formData} onConfirm={submitForm} isSubmitting={isSubmitting} submitError={submitError} submitWarnings={submitWarnings} validationErrors={validationErrors} goToStep={goToStep} fileErrors={fileErrors} />;
      case 4:
        return <Step5Confirmation onReset={resetForm} />;
      default:
        return null;
    }
  };

  return (
    <Layout currentStep={currentStep} logoUrl={logoUrl} logoName={logoName}>
      {!isConfirmationStep && (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-200 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Formulaire Fournisseur</h1>
            <p className="text-sm text-gray-500 font-medium">Complétez les informations ci-dessous pour enregistrer votre entreprise.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button 
              type="button" 
              onClick={saveProgress}
              className={`group px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${isSaved ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'}`}>
              <i className={`fas ${isSaved ? 'fa-check text-green-600' : 'fa-save text-gray-400'} transition-colors`}></i>
              {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
          </div>
        </header>
      )}

      <form onSubmit={handleFormSubmit} className="flex flex-col flex-grow">
        {renderStep()}

        {!isConfirmationStep && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 sticky bottom-0 bg-gray-50/95 backdrop-blur-sm pb-6 z-10">
            <button 
              type="button"
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${currentStep === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-800 shadow-sm'}`}
            >
              <i className="fas fa-arrow-left text-sm"></i> Précédent
            </button>

            {!isLastStep && (
              <button 
                type="button"
                onClick={goToNextStep}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-900/20 flex items-center gap-2 group"
              >
                Suivant <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </button>
            )}
          </div>
        )}
      </form>
    </Layout>
  );
}

export default App;
