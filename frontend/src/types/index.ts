export interface Therapist {
  id: string;
  name: string;
  specialization: 'Terapi Wicara' | 'Fisioterapi' | 'Terapi Okupasi';
  phone: string;
  availability: {
    [key: string]: { // day of week
      available: boolean;
      startTime: string;
      endTime: string;
    };
  };
}

export interface Patient {
  medicalRecordNumber: string;
  name: string;
  contact: string;
  patientType: 'regular' | 'bpjs';
  referralData?: {
    referralNumber: string;
    issuedDate: string;
    expiryDate: string;
    referringDoctor: string;
  };
}

export interface Appointment {
  id: string;
  therapistId: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'no-show' | 'canceled';
  sessionType: 'regular' | 'bpjs';
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  therapistId?: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'no-show' | 'canceled';
export type PatientType = 'regular' | 'bpjs';
export type Specialization = 'Terapi Wicara' | 'Fisioterapi' | 'Terapi Okupasi';