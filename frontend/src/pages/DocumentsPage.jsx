import React, { useState } from 'react';
import { FileText, Plus, FolderOpen, AlertCircle } from 'lucide-react';
import DocumentTable from '../components/documents/DocumentTable';
import DeleteDialog from '../components/documents/DeleteDialog';
import UploadModal from '../components/upload/UploadModal';
import ProcessingScreen from '../components/upload/ProcessingScreen';
import { deleteDocument, uploadDocuments } from '../lib/api';

export default function DocumentsPage({ documents, onDocumentsChanged }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [error, setError] = useState('');

  const handleStartProcessing = async (files) => {
    setIsUploadModalOpen(false);
    setError('');
    try {
      const created = await uploadDocuments(files);
      setProcessingIds(created.map((doc) => doc.id));
      onDocumentsChanged();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleProcessingComplete = () => {
    setProcessingIds(null);
    onDocumentsChanged();
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument(docToDelete.id);
      onDocumentsChanged();
    } catch (e) {
      setError(e.message);
    }
    setDocToDelete(null);
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-[#080B11] overflow-y-auto p-6 sm:p-8 space-y-6">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Documents Repository</h1>
          </div>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Table or Empty State */}
      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 rounded-3xl border border-slate-800/80 space-y-4 my-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No documents uploaded yet</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Upload your first document to begin indexing text chunks and enabling AI assistant Q&amp;A.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            Upload your first document
          </button>
        </div>
      ) : (
        <DocumentTable
          documents={documents}
          onDeleteClick={(doc) => setDocToDelete(doc)}
        />
      )}

      <DeleteDialog
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDelete}
        name={docToDelete?.filename}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onStartProcessing={handleStartProcessing}
      />

      {processingIds && (
        <ProcessingScreen documentIds={processingIds} onComplete={handleProcessingComplete} />
      )}

    </div>
  );
}
