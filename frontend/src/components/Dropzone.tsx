import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle } from 'lucide-react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

export default function Dropzone({ onFilesAdded }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesAdded(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesAdded(files);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 transition-all animate-in fade-in zoom-in duration-500">
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center
          ${isDragOver ? 'border-brand-accent bg-brand-light shadow-xl transform scale-105' : 'border-gray-300 bg-white hover:border-brand-sage hover:bg-gray-50 hover:shadow-lg'}
        `}
        style={{ minHeight: '320px' }}
      >
        <input 
          type="file" 
          multiple 
          accept="image/*,application/pdf"
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleChange}
        />
        
        <div className="bg-brand-sage/10 p-5 rounded-full mb-6 relative group overflow-visible">
          <UploadCloud className="w-12 h-12 text-brand-navy group-hover:scale-110 transition-transform" />
          {isDragOver && (
             <div className="absolute inset-0 border-2 border-brand-accent rounded-full animate-ping opacity-75"></div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-brand-navy mb-2 tracking-tight">
          Suelta tus comprobantes aqui
        </h3>
        <p className="text-brand-sage mb-6 max-w-md mx-auto text-sm leading-relaxed">
          Arrastra hasta 50 comprobantes (JPG, PNG o PDF). Soporta{' '}
          <strong>Facturas A/B/C</strong>, <strong>Tickets de Controlador Fiscal</strong>,{' '}
          <strong>Ticket Factura</strong> y <strong>Ticket Combustible</strong>.
          La IA identifica y extrae automaticamente segun normativa ARCA.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button className="btn-primary flex items-center justify-center gap-2 shadow-sm">
            <FileType size={18} /> Explorar Archivos
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 max-w-lg mx-auto">
          <p className="text-xs text-gray-400 leading-tight">
            Al subir archivos, declaras contar con consentimiento e indicas comprensión de que los datos son procesados temporalmente mediante Inteligencia Artificial (Estados Unidos). No almacenamos de forma permanente tus reportes ni imágenes.
          </p>
        </div>
      </div>
      
      {/* Cajas de ventajas */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-center">
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
            <div className="bg-brand-light w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-[#4ade80]" />
            </div>
            <span className="font-semibold text-brand-navy block mb-1">Calculo Modulo 11</span>
            <span className="text-brand-sage text-xs">Rechaza CUITs invalidos que la IA pueda alucinar.</span>
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
            <div className="bg-brand-light w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-[#4ade80]" />
            </div>
            <span className="font-semibold text-brand-navy block mb-1">Multi-Comprobante</span>
            <span className="text-brand-sage text-xs">Tickes fiscales, Ticket Factura, Combustible y Facturas electronicas.</span>
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
             <div className="bg-brand-light w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-[#4ade80]" />
            </div>
            <span className="font-semibold text-brand-navy block mb-1">Exportacion Nativa</span>
            <span className="text-brand-sage text-xs">Archivos listos para TXT Holistor, Tango o CSV.</span>
         </div>
      </div>
    </div>
  );
}
