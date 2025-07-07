import axios from 'axios';
import { Therapist, Patient, Appointment } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Therapist API
export const therapistAPI = {
  getAll: async (): Promise<Therapist[]> => {
    const response = await api.get('/therapists');
    return response.data;
  },

  getById: async (id: string): Promise<Therapist> => {
    const response = await api.get(`/therapists/${id}`);
    return response.data;
  },

  create: async (therapist: Therapist): Promise<void> => {
    await api.post('/therapists', therapist);
  },

  update: async (id: string, therapist: Partial<Therapist>): Promise<void> => {
    await api.put(`/therapists/${id}`, therapist);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/therapists/${id}`);
  },
};

// Patient API
export const patientAPI = {
  getAll: async (): Promise<Patient[]> => {
    const response = await api.get('/patients');
    return response.data;
  },

  getById: async (medicalRecordNumber: string): Promise<Patient> => {
    const response = await api.get(`/patients/${medicalRecordNumber}`);
    return response.data;
  },

  create: async (patient: Patient): Promise<void> => {
    await api.post('/patients', patient);
  },

  update: async (medicalRecordNumber: string, patient: Partial<Patient>): Promise<void> => {
    await api.put(`/patients/${medicalRecordNumber}`, patient);
  },

  delete: async (medicalRecordNumber: string): Promise<void> => {
    await api.delete(`/patients/${medicalRecordNumber}`);
  },
};

// Appointment API
export const appointmentAPI = {
  getAll: async (): Promise<Appointment[]> => {
    const response = await api.get('/appointments');
    return response.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  getByDate: async (date: string): Promise<Appointment[]> => {
    const response = await api.get(`/appointments/date/${date}`);
    return response.data;
  },

  getByTherapist: async (therapistId: string): Promise<Appointment[]> => {
    const response = await api.get(`/appointments/therapist/${therapistId}`);
    return response.data;
  },

  create: async (appointment: Appointment): Promise<void> => {
    await api.post('/appointments', appointment);
  },

  update: async (id: string, appointment: Partial<Appointment>): Promise<void> => {
    await api.put(`/appointments/${id}`, appointment);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },
};

export default api;