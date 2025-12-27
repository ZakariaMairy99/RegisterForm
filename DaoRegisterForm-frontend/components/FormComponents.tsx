
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
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-medium mb-1 text-text-main">
      {label} {required && showRequiredIndicator && <span className="text-red-500">*</span>}
    </label>
    <input
      className={`px-2 py-1.5 rounded-md text-xs text-text-main bg-gray-50 focus:outline-none transition-all ${error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
      required={required}
      {...props}
    />
    {error ? (
      <small className="text-red-600 text-xs mt-0.5">{error}</small>
    ) : (
      helperText && <small className="text-text-muted text-xs mt-0.5">{helperText}</small>
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
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-medium mb-1 text-text-main">
      {label} {required && showRequiredIndicator && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <select
        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-text-main bg-gray-50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer"
        required={required}
        {...props}
      >
        <option value="">Sélectionner</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
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
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, label, description, files, onFilesChange, required, showRequiredIndicator = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Ensure files is always an array, never undefined
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
    // Simple size check 5MB
    const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length !== newFiles.length) {
      alert("⚠️ Certains fichiers dépassent la limite de 5Mo.");
    }
    
    if (validFiles.length > 0) {
      onFilesChange([...safeFiles, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...safeFiles];
    updated.splice(index, 1);
    onFilesChange(updated);
  };

  return (
    <div className="flex flex-col gap-1 p-2.5 bg-app-surface border border-app-border rounded-lg">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-text-main">
          {label} {required && showRequiredIndicator && <span className="text-red-500">*</span>}
        </label>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${safeFiles.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          {safeFiles.length} fichier{safeFiles.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-xs text-text-muted">{description}</p>
      
      <div
        className={`border-2 border-dashed rounded px-2 py-1.5 flex items-center justify-center gap-1 transition-all bg-gray-50 ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:bg-gray-100/50'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,.txt,.tiff,application/pdf,image/*,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileSelect}
        />
        <i className="fas fa-cloud-upload-alt text-sm text-primary"></i>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-1.5 py-0.5 border border-gray-600 rounded text-xs font-medium transition-colors cursor-pointer text-text-main hover:bg-primary hover:text-white"
        >
          Parcourir
        </button>
        <span className="text-xs text-gray-400">ou glisser</span>
      </div>

      {safeFiles.length > 0 && (
        <div className="mt-1 border-t border-gray-100 pt-1 max-h-20 overflow-y-auto custom-scrollbar space-y-0.5">
          {safeFiles.map((file, idx) => (
            <div key={idx} className="flex justify-between items-center py-0.5 px-1 bg-gray-50 rounded border border-gray-200 text-xs text-gray-700 hover:bg-gray-100 transition-colors">
              <span className="truncate max-w-[80%] flex items-center gap-1">
                <i className="fas fa-file-pdf text-red-500 flex-shrink-0"></i>
                {file.name}
              </span>
              <button 
                type="button" 
                onClick={() => removeFile(idx)} 
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
                title="Supprimer"
              >
                <i className="fas fa-times-circle"></i>
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
    <div className="flex flex-col gap-2" ref={containerRef}>
      <label className="text-sm font-bold text-text-main">
        {label} {required && showRequiredIndicator && <span className="text-red-500">*</span>}
      </label>
      <p className="text-xs text-text-muted mb-2">{description}</p>
      
      <div className="relative">
        <div 
          className="min-h-[42px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer flex flex-wrap gap-2 items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selected.length === 0 && <span className="text-gray-400 text-sm">Sélectionner...</span>}
          {selected.map(item => (
            <span key={item} className="bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {item}
              <i 
                className="fas fa-times cursor-pointer hover:text-gray-200"
                onClick={(e) => { e.stopPropagation(); toggleOption(item); }}
              ></i>
            </span>
          ))}
          <div className="ml-auto">
            <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-app-surface border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {options.map(option => (
              <div 
                key={option}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm"
                onClick={() => toggleOption(option)}
              >
                <input 
                  type="checkbox" 
                  checked={selected.includes(option)} 
                  readOnly 
                  className="accent-primary w-4 h-4"
                />
                <span>{option}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
