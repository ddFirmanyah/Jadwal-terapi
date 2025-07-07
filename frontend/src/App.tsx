import { useState } from 'react';
import Header from './components/Layout/Header';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import CalendarView from './components/Calendar/CalendarView';
import AppointmentModal from './components/Appointments/AppointmentModal';
import PatientList from './components/Patients/PatientList';
import PatientModal from './components/Patients/PatientModal';
import ReportGenerator from './components/Reports/ReportGenerator';
import TherapistSettings from './components/Settings/TherapistSettings';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorMessage from './components/UI/ErrorMessage';
import { useTherapists, usePatients, useAppointments } from './hooks/useAPI';
import { Appointment, Patient, Therapist } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [auth, setAuth] = useState<boolean>(() => localStorage.getItem('auth') === 'true');
  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth(false);
    setActiveTab('dashboard');
  };
  
  // Use custom hooks for data management
  const { 
    therapists, 
    loading: therapistsLoading, 
    error: therapistsError,
    addTherapist,
    updateTherapist,
    deleteTherapist,
  } = useTherapists();
  
  const { 
    patients, 
    loading: patientsLoading, 
    error: patientsError,
    addPatient,
    updatePatient,
    deletePatient
  } = usePatients();
  
  const { 
    appointments, 
    loading: appointmentsLoading, 
    error: appointmentsError,
    addAppointment,
    updateAppointment,
    deleteAppointment 
  } = useAppointments();
  
  // Modal states
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const [initialAppointmentDate, setInitialAppointmentDate] = useState<string | undefined>();
  const [initialAppointmentTime, setInitialAppointmentTime] = useState<string | undefined>();
  const [initialTherapistId, setInitialTherapistId] = useState<string | undefined>();

  // Loading state
  const isLoading = therapistsLoading || patientsLoading || appointmentsLoading;
  const hasError = therapistsError || patientsError || appointmentsError;

  // Appointment handlers
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentModalOpen(true);
  };

  const handleCreateAppointment = (therapistId: string, date: string, time: string) => {
    setSelectedAppointment(undefined);
    setInitialAppointmentDate(date);
    setInitialAppointmentTime(time);
    setInitialTherapistId(therapistId);
    setAppointmentModalOpen(true);
  };

  const handleAppointmentSave = async (appointment: Appointment) => {
    try {
      if (selectedAppointment) {
        await updateAppointment(appointment);
      } else {
        await addAppointment(appointment);
      }
      // Close the modal after successful save
      setAppointmentModalOpen(false);
      setSelectedAppointment(undefined);
      setInitialAppointmentDate(undefined);
      setInitialAppointmentTime(undefined);
    } catch (error) {
      console.error('Error saving appointment:', error);
      // Error is already handled in the hook, no need to show it again
    }
  };

  const handleAppointmentDelete = async (appointmentId: string) => {
    try {
      await deleteAppointment(appointmentId);
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  // Patient handlers
  const handlePatientEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientModalOpen(true);
  };

  const handlePatientAdd = () => {
    setSelectedPatient(undefined);
    setPatientModalOpen(true);
  };

  const handlePatientSave = async (patient: Patient) => {
    try {
      if (selectedPatient) {
        await updatePatient(patient);
      } else {
        await addPatient(patient);
      }
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  // Calendar date and filter state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('Terapi Wicara');

  // Therapist handlers
  const handleTherapistUpdate = async (therapist: Therapist) => {
    try {
      await updateTherapist(therapist);
    } catch (error) {
      console.error('Error updating therapist:', error);
    }
  };

  const handleTherapistAdd = async (therapist: Therapist) => {
    try {
      await addTherapist(therapist);
    } catch (error) {
      console.error('Error adding therapist:', error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (hasError) {
      return (
        <ErrorMessage 
          message={therapistsError || patientsError || appointmentsError || 'An error occurred'} 
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            appointments={appointments}
            patients={patients}
            therapists={therapists}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            currentDate={calendarDate}
            onDateChange={setCalendarDate}
            appointments={appointments}
            therapists={therapists}
            patients={patients}
            onAppointmentClick={handleAppointmentClick}
            onCreateAppointment={handleCreateAppointment}
            selectedSpecialization={selectedSpecialization}
            onSpecializationChange={setSelectedSpecialization}
          />
        );
      case 'patients':
        return (
          <PatientList
            patients={patients}
            onPatientEdit={handlePatientEdit}
            onPatientAdd={handlePatientAdd}
            onPatientDelete={deletePatient}
          />
        );
      case 'reports':
        return (
          <ReportGenerator
            appointments={appointments}
            patients={patients}
            therapists={therapists}
          />
        );
      case 'settings':
        return (
          <TherapistSettings
            therapists={therapists}
            appointments={appointments}
            patients={patients}
            onTherapistUpdate={handleTherapistUpdate}
            onTherapistAdd={handleTherapistAdd}
            onTherapistDelete={deleteTherapist}
          />
        );
      default:
        return null;
    }
  };

  if (!auth) {
    return <Login onLoginSuccess={() => setAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => {
          setAppointmentModalOpen(false);
          setSelectedAppointment(undefined);
          setInitialAppointmentDate(undefined);
          setInitialAppointmentTime(undefined);
          setInitialTherapistId(undefined);
        }}
        appointment={selectedAppointment}
        patients={patients}
        therapists={therapists}
        appointments={appointments}
        onSave={handleAppointmentSave}
        onDelete={handleAppointmentDelete}
        initialDate={initialAppointmentDate}
        initialTime={initialAppointmentTime}
        initialTherapistId={initialTherapistId}
      />

      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => {
          setPatientModalOpen(false);
          setSelectedPatient(undefined);
        }}
        patient={selectedPatient}
        onSave={handlePatientSave}
      />
    </div>
  );
}

export default App;