
import React, { useRef, useState, useEffect } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string | null;
  // When true, display the visual required asterisk next to the label.
  showRequiredIndicator?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, required, helperText, error = null, showRequiredIndicator = false, className = "", ...props }) => (
  <div className={`flex flex-col group ${className}`}>
    <label className="text-xs font-medium mb-0.5 text-gray-700">
      {label} {required && showRequiredIndicator && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        className={`w-full px-3 py-1.5 rounded-lg text-xs text-gray-900 bg-white border shadow-sm transition-all duration-200 outline-none
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50' 
            : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
          }
          disabled:bg-gray-50 disabled:text-gray-500`}
        required={required}
        {...props}
      />
    </div>
    {error ? (
      <p className="text-red-500 text-[11px] mt-0.5 flex items-center gap-1">
        <i className="fas fa-exclamation-circle"></i> {error}
      </p>
    ) : (
      helperText && <p className="text-gray-500 text-[11px] mt-0.5">{helperText}</p>
    )}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  showRequiredIndicator?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, options, required, showRequiredIndicator = false, className = "", ...props }) => (
  <div className={`flex flex-col group ${className}`}>
    <label className="text-xs font-medium mb-0.5 text-gray-700">
      {label} {required && showRequiredIndicator && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <select
        className={`appearance-none w-full px-3 py-1.5 rounded-lg text-xs text-gray-900 bg-white border shadow-sm transition-all duration-200 outline-none cursor-pointer
          border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50`}
        required={required}
        {...props}
      >
        <option value="" className="text-gray-400">Sélectionner une option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <i className="fas fa-chevron-down text-xs"></i>
      </div>
    </div>
  </div>
);

interface FileUploadProps {
  id: string;
  label: string;
  description: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  required?: boolean;
  showRequiredIndicator?: boolean;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, label, description, files, onFilesChange, required, showRequiredIndicator = false, maxFiles }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const safeFiles = Array.isArray(files) ? files : [];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length !== newFiles.length) {
      alert("⚠️ Certains fichiers dépassent la limite de 5Mo.");
    }
    
    if (validFiles.length > 0) {
      let filesToAdd = [...safeFiles, ...validFiles];
      if (maxFiles && filesToAdd.length > maxFiles) {
        filesToAdd = filesToAdd.slice(0, maxFiles);
      }
      onFilesChange(filesToAdd);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...safeFiles];
    updated.splice(index, 1);
    onFilesChange(updated);
  };

  return (
    <div className="flex flex-col gap-1 p-2.5 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-gray-800 block mb-0.5">
            {label} {required && showRequiredIndicator && <span className="text-red-500">*</span>}
          </label>
          <p className="text-[11px] text-gray-500 leading-tight">{description}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${safeFiles.length > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
          {safeFiles.length} / {maxFiles || '∞'}
        </span>
      </div>
      
      <div
        className={`mt-0.5 border-2 border-dashed rounded-lg px-2.5 py-2.5 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
          }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,.txt,.tiff,application/pdf,image/*,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileSelect}
          multiple
        />
        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
           <i className="fas fa-cloud-upload-alt text-xs"></i>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-semibold text-gray-700 leading-tight">Cliquez pour téléverser</p>
          <p className="text-[10px] text-gray-400 mt-0.5">ou glissez-déposez</p>
        </div>
      </div>

      {safeFiles.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {safeFiles.map((file, idx) => (
            <div key={idx} className="flex justify-between items-center p-1.5 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-5 h-5 rounded-md bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 text-red-500">
                  <i className="fas fa-file-pdf text-[9px]"></i>
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-xs font-medium text-gray-700 truncate">{file.name}</span>
                   <span className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => removeFile(idx)} 
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all"
                title="Supprimer"
              >
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface MultiSelectProps {
  label: string;
  description: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  required?: boolean;
  showRequiredIndicator?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, description, options, selected, onChange, required, showRequiredIndicator = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-col gap-1 group" ref={containerRef}>
      <label className="text-xs font-medium text-gray-700">
        {label} {required && showRequiredIndicator && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-[11px] text-gray-500 mb-0.5">{description}</p>}
      
      <div className="relative">
        <div 
          className={`min-h-[46px] px-3 py-2 rounded-lg border bg-white cursor-pointer flex flex-wrap gap-2 items-center transition-all shadow-sm
            ${isOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {selected.length === 0 && <span className="text-gray-400 text-sm">Sélectionner des options...</span>}
          {selected.map(item => (
            <span key={item} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              {item}
              <i 
                className="fas fa-times cursor-pointer hover:text-blue-900"
                onClick={(e) => { e.stopPropagation(); toggleOption(item); }}
              ></i>
            </span>
          ))}
          <div className="ml-auto pl-2 border-l border-gray-100">
            <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {options.map(option => (
              <div 
                key={option}
                className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 text-sm transition-colors
                  ${selected.includes(option) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => toggleOption(option)}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                  ${selected.includes(option) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                  {selected.includes(option) && <i className="fas fa-check text-white text-[10px]"></i>}
                </div>
                <span>{option}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
