import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import ChatHeader from '../components/chat/ChatHeader';
import Message from '../components/chat/Message';
import ChatInput from '../components/chat/ChatInput';
import UploadModal from '../components/upload/UploadModal';
import ProcessingScreen from '../components/upload/ProcessingScreen';
import { askQuestion, getMessages, uploadDocuments } from '../lib/api';

export default function ChatPage({
  sessionId,
  documentCount,
  onSessionStarted,
  onDocumentsChanged,
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentSession, setCurrentSession] = useState(sessionId);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  // Starts true when opening an existing chat, otherwise the welcome screen
  // flashes up for a moment before the old messages arrive.
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));
  const bottomRef = useRef(null);

  // The page is remounted whenever a chat is opened or started, so loading
  // once here is enough.
  useEffect(() => {
    if (!sessionId) return;
    getMessages(sessionId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

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

  const handleSendMessage = async (question) => {
    setError('');
    setMessages((prev) => [...prev, {
      id: `local-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toISOString(),
      citations: [],
    }]);
    setIsThinking(true);

    try {
      const data = await askQuestion(question, currentSession);
      if (!currentSession) {
        setCurrentSession(data.sessionId);
        onSessionStarted(data.sessionId);
      }
      setMessages((prev) => [...prev, data.message]);
    } catch (e) {
      setError(e.message);
    }
    setIsThinking(false);
  };

  const hasDocuments = documentCount > 0;

  return (
    <div className="flex-1 h-screen flex flex-col bg-[#080B11] overflow-hidden relative">

      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <ChatHeader
        hasDocuments={hasDocuments}
        activeDocCount={documentCount}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      <div className={`flex-1 overflow-y-auto z-0 flex flex-col ${messages.length === 0 ? 'justify-center' : ''}`}>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-5 animate-fade-in my-auto">

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Document Intelligence Assistant
              </h1>
              <p className="text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                {hasDocuments
                  ? 'Ask a question about your indexed documents below, or upload new documents to get started.'
                  : 'Upload a document to get started - answers are only given from what you upload.'}
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2.5 shadow-xl shadow-blue-600/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <UploadCloud className="w-4 h-4 text-blue-200" />
                <span>Upload New Documents</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        ) : (
          <div className="divide-y divide-slate-800/40 pb-6 max-w-4xl mx-auto w-full">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}

      </div>

      {error && (
        <div className="mx-auto mb-2 max-w-4xl w-full px-4">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        </div>
      )}

      <ChatInput
        onSendMessage={handleSendMessage}
        isDisabled={!hasDocuments}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        loadingStep={isThinking ? 'Searching documents and writing an answer...' : ''}
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
