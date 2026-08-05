import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DeleteDialog from './components/documents/DeleteDialog';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import DashboardPage from './pages/DashboardPage';
import { getDocuments, getSessions, deleteSession } from './lib/api';

function AppContent() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [chatKey, setChatKey] = useState(0);

  const loadDocuments = () => getDocuments().then(setDocuments).catch(() => {});
  const loadSessions = () => getSessions().then(setSessions).catch(() => {});

  useEffect(() => {
    loadDocuments();
    loadSessions();
  }, []);

  const startNewChat = () => {
    setActiveSession(null);
    setChatKey((key) => key + 1);
    navigate('/');
  };

  const openChat = (sessionId) => {
    setActiveSession(sessionId);
    setChatKey((key) => key + 1);
    navigate('/');
  };

  const handleSessionStarted = (sessionId) => {
    setActiveSession(sessionId);
    loadSessions();
  };

  const confirmDeleteChat = async () => {
    const chat = chatToDelete;
    setChatToDelete(null);
    try {
      await deleteSession(chat.id);
    } catch {
      return;
    }
    if (chat.id === activeSession) {
      startNewChat();
    }
    loadSessions();
  };

  return (
    <div className="flex h-screen w-screen bg-[#080B11] text-slate-100 overflow-hidden font-sans">

      {/* Persistent Left Sidebar */}
      <Sidebar
        recentChats={sessions}
        activeChatId={activeSession}
        onNewChat={startNewChat}
        onOpenChat={openChat}
        onDeleteChat={setChatToDelete}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
        <Routes>
          <Route
            path="/"
            element={
              <ChatPage
                key={chatKey}
                sessionId={activeSession}
                documentCount={documents.length}
                onSessionStarted={handleSessionStarted}
                onDocumentsChanged={loadDocuments}
              />
            }
          />
          <Route
            path="/documents"
            element={
              <DocumentsPage
                documents={documents}
                onDocumentsChanged={loadDocuments}
              />
            }
          />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>

      <DeleteDialog
        isOpen={!!chatToDelete}
        onClose={() => setChatToDelete(null)}
        onConfirm={confirmDeleteChat}
        name={chatToDelete?.title}
        title="Delete Chat"
        note="Its messages and questions are removed from the dashboard analytics as well."
        confirmLabel="Delete Chat"
      />

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
