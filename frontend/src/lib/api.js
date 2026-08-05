// Empty in development so the Vite proxy handles it, full URL in production.
const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options) {
  const response = await fetch(BASE + '/api' + path, options);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Something went wrong');
  }
  return response.json();
}

export function getDocuments() {
  return request('/documents');
}

export function uploadDocuments(files) {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return request('/documents/upload', { method: 'POST', body: form });
}

export function getDocumentStatus(id) {
  return request(`/documents/${id}/status`);
}

export function deleteDocument(id) {
  return request(`/documents/${id}`, { method: 'DELETE' });
}

export function askQuestion(question, sessionId) {
  return request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, session_id: sessionId }),
  });
}

export function getSessions() {
  return request('/chat/sessions');
}

export function getMessages(sessionId) {
  return request(`/chat/sessions/${sessionId}/messages`);
}

export function deleteSession(sessionId) {
  return request(`/chat/sessions/${sessionId}`, { method: 'DELETE' });
}

export function getStats() {
  return request('/dashboard/stats');
}

export function getRecentQueries() {
  return request('/dashboard/queries');
}

export function getResponses() {
  return request('/dashboard/responses');
}
