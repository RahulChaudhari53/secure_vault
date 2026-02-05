import api from '../api/axios';

const NOTE_URL = '/notes';

const getNotes = async () => {
  const response = await api.get(NOTE_URL);
  return response.data;
};

const getTrashedNotes = async () => {
    const response = await api.get(`${NOTE_URL}/trash`); 
    return response.data;
};

const createNote = async (noteData) => {
  const response = await api.post(NOTE_URL, noteData);
  return response.data;
};

const updateNote = async (id, noteData) => {
  const response = await api.put(`${NOTE_URL}/${id}`, noteData);
  return response.data;
};

const shareNote = async (id, email) => {
  const response = await api.post(`${NOTE_URL}/${id}/share`, { email });
  return response.data;
};

const softDeleteNote = async (id) => {
  const response = await api.put(`${NOTE_URL}/${id}/trash`);
  return response.data;
};

const restoreNote = async (id) => {
  const response = await api.put(`${NOTE_URL}/${id}/restore`);
  return response.data;
};

const permanentDeleteNote = async (id) => {
  const response = await api.delete(`${NOTE_URL}/${id}`);
  return response.data;
};

const revokeAccess = async (id, userId) => {
  const response = await api.delete(`${NOTE_URL}/${id}/share/${userId}`);
  return response.data;
};

const noteService = {
  getNotes,
  getTrashedNotes,
  createNote,
  updateNote,
  shareNote,
  softDeleteNote,
  restoreNote,
  permanentDeleteNote,
  revokeAccess
};

export default noteService;
