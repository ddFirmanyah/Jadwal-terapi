import { Therapist, Patient, Appointment } from '../types';
import { addDays, format, addMinutes } from 'date-fns';

export const therapists: Therapist[] = [
  // Terapi Wicara
  {
    id: 'tw-001',
    name: 'Dr. Sarah Amelia',
    specialization: 'Terapi Wicara',
    phone: '+62812-3456-7890',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'tw-002',
    name: 'Andi Pratama, S.ST',
    specialization: 'Terapi Wicara',
    phone: '+62813-4567-8901',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'tw-003',
    name: 'Maya Sari, M.Kes',
    specialization: 'Terapi Wicara',
    phone: '+62814-5678-9012',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'tw-004',
    name: 'Rino Handoko, S.ST',
    specialization: 'Terapi Wicara',
    phone: '+62815-6789-0123',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  // Fisioterapi
  {
    id: 'ft-001',
    name: 'Dr. Ahmad Fauzi',
    specialization: 'Fisioterapi',
    phone: '+62816-7890-1234',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'ft-002',
    name: 'Lisa Kartika, S.Ft',
    specialization: 'Fisioterapi',
    phone: '+62817-8901-2345',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'ft-003',
    name: 'Budi Santoso, M.Fis',
    specialization: 'Fisioterapi',
    phone: '+62818-9012-3456',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'ft-004',
    name: 'Sari Dewi, S.Ft',
    specialization: 'Fisioterapi',
    phone: '+62819-0123-4567',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  // Terapi Okupasi
  {
    id: 'to-001',
    name: 'Dr. Indira Sari',
    specialization: 'Terapi Okupasi',
    phone: '+62820-1234-5678',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'to-002',
    name: 'Fadli Rahman, S.TO',
    specialization: 'Terapi Okupasi',
    phone: '+62821-2345-6789',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'to-003',
    name: 'Nina Kusuma, M.TO',
    specialization: 'Terapi Okupasi',
    phone: '+62822-3456-7890',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
  {
    id: 'to-004',
    name: 'Eko Prasetyo, S.TO',
    specialization: 'Terapi Okupasi',
    phone: '+62823-4567-8901',
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '08:00', endTime: '17:00' },
      sunday: { available: false, startTime: '08:00', endTime: '17:00' },
    },
  },
];

export const patients: Patient[] = [
  {
    medicalRecordNumber: 'MR-001',
    name: 'John Doe Sutrisno',
    contact: '+62812-1111-1111',
    patientType: 'regular',
  },
  {
    medicalRecordNumber: 'MR-002',
    name: 'Jane Smith Pratiwi',
    contact: '+62813-2222-2222',
    patientType: 'bpjs',
    referralData: {
      referralNumber: 'REF-2024-001',
      issuedDate: '2024-01-15',
      expiryDate: '2024-04-15',
      referringDoctor: 'Dr. Andi Susanto',
    },
  },
  {
    medicalRecordNumber: 'MR-003',
    name: 'Ahmad Wijaya',
    contact: '+62814-3333-3333',
    patientType: 'bpjs',
    referralData: {
      referralNumber: 'REF-2024-002',
      issuedDate: '2024-02-01',
      expiryDate: '2024-05-01',
      referringDoctor: 'Dr. Sri Wahyuni',
    },
  },
  {
    medicalRecordNumber: 'MR-004',
    name: 'Siti Nurhaliza',
    contact: '+62815-4444-4444',
    patientType: 'regular',
  },
  {
    medicalRecordNumber: 'MR-005',
    name: 'Budi Setiawan',
    contact: '+62816-5555-5555',
    patientType: 'bpjs',
    referralData: {
      referralNumber: 'REF-2024-003',
      issuedDate: '2024-01-20',
      expiryDate: '2024-04-20',
      referringDoctor: 'Dr. Maya Sari',
    },
  },
];

// Generate sample appointments for today and the next few days
const generateSampleAppointments = (): Appointment[] => {
  const appointments: Appointment[] = [];
  const today = new Date();
  
  // Today's appointments
  appointments.push(
    {
      id: 'apt-001',
      therapistId: 'tw-001',
      patientId: 'MR-001',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '09:45',
      status: 'scheduled',
      sessionType: 'regular',
    },
    {
      id: 'apt-002',
      therapistId: 'ft-001',
      patientId: 'MR-002',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '10:00',
      endTime: '10:30',
      status: 'scheduled',
      sessionType: 'bpjs',
    },
    {
      id: 'apt-003',
      therapistId: 'to-001',
      patientId: 'MR-003',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '11:30',
      status: 'completed',
      sessionType: 'bpjs',
    }
  );

  // Tomorrow's appointments
  const tomorrow = addDays(today, 1);
  appointments.push(
    {
      id: 'apt-004',
      therapistId: 'tw-002',
      patientId: 'MR-004',
      date: format(tomorrow, 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '08:45',
      status: 'scheduled',
      sessionType: 'regular',
    },
    {
      id: 'apt-005',
      therapistId: 'ft-002',
      patientId: 'MR-005',
      date: format(tomorrow, 'yyyy-MM-dd'),
      startTime: '14:00',
      endTime: '14:30',
      status: 'scheduled',
      sessionType: 'bpjs',
    }
  );

  return appointments;
};

export const appointments: Appointment[] = generateSampleAppointments();