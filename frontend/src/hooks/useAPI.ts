import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { therapistAPI, patientAPI, appointmentAPI } from '../services/api';
import { Therapist, Patient, Appointment } from '../types';

// Custom hook for therapists
export const useTherapists = () => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const data = await therapistAPI.getAll();
      setTherapists(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch therapists');
      console.error('Error fetching therapists:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTherapist = async (therapist: Therapist) => {
    try {
      await therapistAPI.create(therapist);
      await fetchTherapists(); // Refresh data
    } catch (err) {
      setError('Failed to add therapist');
      throw err;
    }
  };

  const updateTherapist = async (therapist: Therapist) => {
    try {
      await therapistAPI.update(therapist.id, therapist);
      await fetchTherapists(); // Refresh data
    } catch (err) {
      setError('Failed to update therapist');
      throw err;
    }
  };

  const deleteTherapist = async (id: string) => {
    try {
      await therapistAPI.delete(id);
      await fetchTherapists(); // Refresh data
    } catch (err) {
      setError('Failed to delete therapist');
      throw err;
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  return {
    therapists,
    loading,
    error,
    addTherapist,
    updateTherapist,
    deleteTherapist,
    refetch: fetchTherapists,
  };
};

// Custom hook for patients
export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientAPI.getAll();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async (patient: Patient) => {
    try {
      await patientAPI.create(patient);
      await fetchPatients(); // Refresh data
    } catch (err) {
      setError('Failed to add patient');
      throw err;
    }
  };

  const updatePatient = async (patient: Patient) => {
    try {
      await patientAPI.update(patient.medicalRecordNumber, patient);
      await fetchPatients(); // Refresh data
    } catch (err) {
      setError('Failed to update patient');
      throw err;
    }
  };

  const deletePatient = async (medicalRecordNumber: string) => {
    try {
      await patientAPI.delete(medicalRecordNumber);
      await fetchPatients(); // Refresh data
    } catch (err) {
      setError('Failed to delete patient');
      throw err;
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return {
    patients,
    loading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    refetch: fetchPatients,
  };
};

// Custom hook for appointments
export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeDate = (dateVal: string | Date): string => {
    if (!dateVal) return '';
    // If dateVal is a Date instance, format directly
    if (dateVal instanceof Date) {
      return format(dateVal, 'yyyy-MM-dd');
    }
    try {
      return format(parseISO(dateVal as string), 'yyyy-MM-dd');
    } catch {
      return (dateVal as string).slice(0, 10);
    }
  };

  const normalizeTime = (timeVal: string): string => {
    if (!timeVal) return '';
    const parts = timeVal.split(':');
    const hours = parts[0] || '00';
    const minutes = parts[1] || '00';
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentAPI.getAll();
      // Ensure each appointment date is normalized to 'yyyy-MM-dd'
      const normalized = data.map((apt) => ({
        ...apt,
        date: normalizeDate(apt.date),
        startTime: normalizeTime(apt.startTime),
        endTime: normalizeTime(apt.endTime),
      }));
      setAppointments(normalized);
      setError(null);
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointment: Appointment) => {
    try {
      // Optimistic update (normalize date before pushing)
      const normalizedAppointment = {
        ...appointment,
        date: normalizeDate(appointment.date),
        startTime: normalizeTime(appointment.startTime),
        endTime: normalizeTime(appointment.endTime),
      } as Appointment;
      setAppointments(prev => [...prev, normalizedAppointment]);
      // Save to server
      await appointmentAPI.create(appointment);
      // Refresh from server to ensure consistency
      await fetchAppointments();
    } catch (err) {
      // Revert on error
      setAppointments(prev => prev.filter(a => a.id !== appointment.id));
      setError('Gagal menambahkan janji temu');
      throw err;
    }
  };

  const updateAppointment = async (appointment: Appointment) => {
    try {
      await appointmentAPI.update(appointment.id, appointment);
      await fetchAppointments(); // Refresh data
    } catch (err) {
      setError('Failed to update appointment');
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await appointmentAPI.delete(id);
      await fetchAppointments(); // Refresh data
    } catch (err) {
      setError('Failed to delete appointment');
      throw err;
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return {
    appointments,
    loading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
  };
};