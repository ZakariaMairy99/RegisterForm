
import React from 'react';
import Logo from './Logo';
import { STEPS } from '../types';

interface SidebarProps {
  currentStep: number;
  logoUrl?: string | null;
  logoName?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStep, logoUrl = null, logoName = null }) => {
  return (
    <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-100 flex md:flex-col p-6 md:p-10 flex-shrink-0 md:h-full md:overflow-y-auto z-20 shadow-sm relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 md:hidden"></div>

      <div className="mb-0 md:mb-16 mr-6 md:mr-0 flex items-center md:block">
        <div className="w-full flex items-center gap-4">
          {logoUrl ? (
            <Logo src={logoUrl || undefined} alt={logoName || 'Brand'} size={48} className="flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
              <i className="fas fa-cube text-xl"></i>
            </div>
          )}

          <div className="flex flex-col">
            <div className="text-xl font-bold text-gray-900 tracking-tight leading-none">
              {logoName ?? <>PORTAIL<span className="text-blue-600">PRO</span></>}
            </div>
            <span className="text-xs text-gray-400 font-medium mt-1">Plateforme Fournisseurs</span>
          </div>
        </div>
      </div>

      <div className="flex md:flex-col md:flex-1 overflow-x-auto md:overflow-visible w-full no-scrollbar py-4 md:py-0">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={index} className="group relative flex md:flex-row flex-col items-center md:items-start min-w-[80px] md:min-w-0 md:mb-0">
              {!isLast && (
                <div className="hidden md:block absolute left-[19px] top-[40px] bottom-[-16px] w-[2px] z-0">
                  <div className={`w-full h-full transition-colors duration-500 ease-in-out ${isCompleted ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
                </div>
              )}

              {!isLast && (
                <div className="md:hidden absolute top-[14px] left-[50%] right-[-50%] h-[2px] z-0">
                   <div className={`w-full h-full transition-colors duration-500 ease-in-out ${isCompleted ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
                </div>
              )}

              <div className="flex flex-col items-center md:flex-row md:items-start w-full z-10 md:pb-12">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 transition-all duration-300 md:mr-5 mb-2 md:mb-0 z-10
                    ${isCompleted 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                      : isActive 
                        ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-50' 
                        : 'bg-white border-gray-200 text-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <i className="fas fa-check text-xs"></i>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                <div className={`flex flex-col items-center md:items-start transition-all duration-300 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-40'}`}>
                  <h5 className={`
                    text-[10px] uppercase tracking-wider font-bold mb-0.5
                    ${isActive ? 'text-blue-600' : 'text-gray-400'}
                  `}>
                   ÉTAPE {index + 1}
                  </h5>
                  <span className={`
                    hidden md:block text-base font-semibold leading-tight
                    ${isActive ? 'text-gray-900' : 'text-gray-600'}
                 `}>
                    {step.title}
                  </span>
                  {isActive && (
                     <span className="hidden md:inline-block text-xs text-gray-400 mt-1 max-w-[180px] leading-relaxed">
                       Veuillez remplir les informations requises pour cette étape.
                     </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="hidden md:flex mt-auto pt-8 border-t border-gray-100 flex-col gap-4">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
           <p className="text-xs text-gray-500 mb-2 font-medium">Besoin d'aide ?</p>
           <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">
              <i className="fas fa-envelope-open-text text-blue-500"></i>
              <span>support@platform.com</span>
           </div>
        </div>
        <p className="text-[10px] text-gray-300 text-center">© 2024 Portail Fournisseurs v1.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
