
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Formulaire Fournisseur</h1>
            <p className="text-gray-500 mt-1">Complétez les informations pour l'enregistrement.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button 
              type="button" 
              onClick={saveProgress}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                isSaved 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <i className={`fas ${isSaved ? 'fa-check text-green-500' : 'fa-save'} text-xs`}></i>
              {isSaved ? 'Brouillon sauvegardé' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col flex-grow relative">
        {renderStep()}

        {!isConfirmationStep && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button 
              type="button"
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2
                ${currentStep === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <i className="fas fa-arrow-left text-xs"></i> Précédent
            </button>

            {!isLastStep ? (
              <button 
                type="button"
                onClick={goToNextStep}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2 group text-sm transform active:scale-95"
              >
                Suivant <i className="fas fa-arrow-right text-xs group-hover:translate-x-0.5 transition-transform"></i>
              </button>
            ) : (
             <button 
                type="button"
                onClick={submitForm}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-green-300 transition-all flex items-center gap-2 group text-sm transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-check"></i>}
                Confirmer l'inscription
              </button>
            )}
          </div>
        )}
      </form>
    </Layout>
  );
}

export default App;
