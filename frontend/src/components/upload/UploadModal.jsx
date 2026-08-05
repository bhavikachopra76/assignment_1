import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, AlertCircle } from 'lucide-react';

const VALID_TYPES = ['pdf', 'docx', 'txt'];

export default function UploadModal({ isOpen, onClose, onStartProcessing }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [rejected, setRejected] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const addFiles = (files) => {
    const accepted = files.filter((file) => VALID_TYPES.includes(extensionOf(file.name)));
    setRejected(files.filter((file) => !VALID_TYPES.includes(extensionOf(file.name))).map((f) => f.name));

    setSelectedFiles((prev) => {
      const alreadyThere = (file) => prev.some((f) => f.name === file.name && f.size === file.size);
      return [...prev, ...accepted.filter((file) => !alreadyThere(file))];
    });
  };

  const removeFile = (name) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== name));
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setRejected([]);
    onClose();
  };

  const handleUploadSubmit = () => {
    if (selectedFiles.length === 0) return;
    const files = selectedFiles;
    setSelectedFiles([]);
    setRejected([]);
    onStartProcessing(files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-400" />
              Upload Documents
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Select PDF, DOCX, or TXT documents to index.</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.docx,.txt"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium text-slate-200">
              Drag and drop your files here, or <span className="text-blue-400 hover:underline font-semibold">Browse Files</span>
            </p>

            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">PDF</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">DOCX</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">TXT</span>
            </div>
          </div>

          {rejected.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Skipped {rejected.join(', ')} — only PDF, DOCX and TXT files can be indexed.</span>
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Selected Files ({selectedFiles.length})
              </p>
              {selectedFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {formatSize(file.size)} • {extensionOf(file.name).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={selectedFiles.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            {selectedFiles.length > 0 ? `Upload ${selectedFiles.length} File(s)` : 'Upload'}
          </button>
        </div>

      </div>
    </div>
  );
}

function extensionOf(name) {
  return name.split('.').pop().toLowerCase();
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
