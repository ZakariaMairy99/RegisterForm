
import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  currentStep: number;
  children: React.ReactNode;
  logoUrl?: string | null;
  logoName?: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ currentStep, children, logoUrl = null, logoName = null }) => {
  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-gray-50">
      <Sidebar currentStep={currentStep} logoUrl={logoUrl} logoName={logoName} />
      <div id="main-content" className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 relative scroll-smooth">
        <div className="p-4 md:p-12 max-w-6xl mx-auto w-full flex flex-col flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};
