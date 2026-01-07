import React from 'react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8 font-inter">
      <div className="max-w-xl text-center">
        <div className="relative inline-flex items-center justify-center w-32 h-32 mb-10">
           <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20"></div>
           <div className="relative w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-indigo-100 flex items-center justify-center text-primary text-4xl border border-indigo-50">
              <i className="fas fa-ghost"></i>
           </div>
        </div>
        
        <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Perdu dans le Cloud ?</h1>
        <p className="text-slate-500 mb-10 font-medium leading-relaxed max-w-sm mx-auto">
          La page que vous recherchez semble avoir disparu. Ne vous inquiétez pas, vous pouvez reprendre votre enregistrement facilement.
        </p>
        
        <a href="/" className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95">
          <i className="fas fa-arrow-left"></i>
          Retour au Portail
        </a>
      </div>
    </div>
  );
};

export default NotFound;
