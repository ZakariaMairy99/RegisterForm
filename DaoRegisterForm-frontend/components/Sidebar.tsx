
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
    <div className="w-full md:w-80 bg-app-surface border-b md:border-b-0 md:border-r border-app-border flex md:flex-col p-6 md:p-8 flex-shrink-0 sticky top-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Logo Section */}
         <div className="mb-0 md:mb-24 mr-6 md:mr-0 flex items-center md:block">
           {/* Branding: logo left, name right */}
           <div className="w-full flex items-center justify-start gap-4">
             {logoUrl ? (
               <Logo src={logoUrl || undefined} alt={logoName || 'Brand'} size={64} className="flex-shrink-0" />
             ) : (
               <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 text-white font-bold text-xl">
                 <i className="fas fa-cube"></i>
               </div>
             )}

             <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
               <div
                 className="text-lg font-semibold text-text-main tracking-tight"
                 style={{ textShadow: '10px 10px 6px rgba(8,15,40,0.04)', lineHeight: 1.05 }}
               >
                 {logoName ? logoName : <>PORTAIL<span className="text-primary">PRO</span></>}
               </div>
               <div className="text-sm text-text-muted" style={{ marginTop: 2 }}>
                 {/* optional subtitle / developer name could go here */}
               </div>
             </div>
           </div>

      {/* Stepper Container */}
      <div className="flex md:flex-col md:flex-1 overflow-x-auto md:overflow-visible w-full gap-0 no-scrollbar py-2 md:my-16">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={index} className="group relative flex md:flex-row flex-col items-center md:items-stretch min-w-[80px] md:min-w-0 md:mb-0">
              
              {/* Vertical Line (Desktop) */}
              {!isLast && (
                <div className="hidden md:block absolute left-[23px] top-[48px] bottom-[-12px] w-[2px] z-0">
                  <div className={`w-full h-full transition-colors duration-500 ease-in-out ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`}></div>
                </div>
              )}

              {/* Horizontal Line (Mobile) */}
              {!isLast && (
                <div className="md:hidden absolute top-[15px] left-[50%] right-[-50%] h-[2px] z-0">
                   <div className={`w-full h-full transition-colors duration-500 ease-in-out ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`}></div>
                </div>
              )}

              <div className="flex flex-col items-center md:flex-row md:items-center w-full z-10 md:pb-12">
                {/* Step Marker */}
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-base font-bold border-[3px] flex-shrink-0 transition-all duration-300 md:mr-6 mb-2 md:mb-0 shadow-sm
                    ${isCompleted 
                      ? 'bg-primary border-primary text-white shadow-primary/20' 
                      : isActive 
                        ? 'bg-app-surface border-primary text-primary shadow-md scale-110' 
                        : 'bg-app-surface border-gray-200 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <i className="fas fa-check text-sm transform transition-transform duration-300 scale-100"></i>
                  ) : (
                    <span className="transition-opacity duration-300">{index + 1}</span>
                  )}
                </div>
                
                {/* Text Content */}
                <div className={`flex flex-col items-center md:items-start transition-opacity duration-300 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-80 md:opacity-100' : 'opacity-50 md:opacity-100'}`}>
                  <h5 className={`
                    text-[11px] font-bold uppercase tracking-widest mb-1 
                    ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-gray-400'}
                  `}>
                    {isCompleted ? 'COMPLÉTÉ' : step.label}
                  </h5>
                  <span className={`
                    hidden md:block text-base font-medium leading-tight max-w-[200px]
                    ${isActive ? 'text-text-main font-bold' : 'text-text-muted'}
                  `}>
                    {step.title}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer / Support Link (Desktop only) */}
      <div className="hidden md:flex mt-auto pt-8 border-t border-app-border">
        <div className="flex items-center gap-3 text-text-muted text-sm hover:text-primary cursor-pointer transition-colors">
          <i className="far fa-question-circle"></i>
          <span>Besoin d'aide ?</span>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Sidebar;
