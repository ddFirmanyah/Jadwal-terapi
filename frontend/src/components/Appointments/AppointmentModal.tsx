import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { X, User, Calendar, Clock, Phone, FileText, Save, Trash2 } from 'lucide-react';
import { Appointment, Patient, Therapist, AppointmentStatus } from '../../types';
import { format, addMinutes, parseISO } from 'date-fns';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment;
  patients: Patient[];
  therapists: Therapist[];
  appointments: Appointment[];
  onSave: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
  initialDate?: string;
  initialTime?: string;
  initialTherapistId?: string;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  patients,
  therapists,
  appointments,
  onSave,
  onDelete,
  initialDate,
  initialTime,
  initialTherapistId,
}) => {
  const [formData, setFormData] = useState({
    therapistId: initialTherapistId || '',
    patientId: '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    startTime: initialTime || '09:00',
    sessionType: 'regular' as 'regular' | 'bpjs',
    status: 'scheduled' as AppointmentStatus,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  

  useEffect(() => {
    if (appointment) {
      setFormData({
        therapistId: appointment.therapistId,
        patientId: appointment.patientId,
        date: appointment.date,
        startTime: appointment.startTime,
        sessionType: appointment.sessionType,
        status: appointment.status,
        notes: appointment.notes || '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        therapistId: initialTherapistId || prev.therapistId,
        date: initialDate || prev.date,
        startTime: initialTime || prev.startTime,
      }));
    }
  }, [appointment, initialDate, initialTime, initialTherapistId]);

  const calculateEndTime = (startTime: string, sessionType: 'regular' | 'bpjs') => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    
    const duration = sessionType === 'regular' ? 45 : 30;
    const end = addMinutes(start, duration);
    
    return format(end, 'HH:mm');
  };

  // Generate 15-minute time slots from 8:00 to 17:00
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Check if a time slot conflicts with existing appointments for the selected therapist
  const isTimeSlotAvailable = (timeSlot: string) => {
    if (!formData.therapistId || !formData.date) return true;

    const sessionDuration = formData.sessionType === 'regular' ? 45 : 30;
    const slotStart = parseISO(`${formData.date}T${timeSlot}:00`);
    const slotEnd = addMinutes(slotStart, sessionDuration);

    return !appointments.some(apt => {
      // Skip the current appointment being edited
      if (appointment && apt.id === appointment.id) return false;
      
      if (apt.therapistId !== formData.therapistId || apt.date !== formData.date) return false;
      
      const existingStart = parseISO(`${apt.date}T${apt.startTime}:00`);
      const existingEnd = parseISO(`${apt.date}T${apt.endTime}:00`);
      
      // Check if appointments overlap
      return slotStart < existingEnd && slotEnd > existingStart;
    });
  };

  // Check for scheduling conflicts
  const checkSchedulingConflict = (therapistId: string, date: string, startTime: string, sessionType: 'regular' | 'bpjs', excludeAppointmentId?: string) => {
    if (!therapistId || !date || !startTime) return false;

    const endTime = calculateEndTime(startTime, sessionType);
    const newStart = parseISO(`${date}T${startTime}:00`);
    const newEnd = parseISO(`${date}T${endTime}:00`);

    return appointments.some(apt => {
      // Skip the current appointment being edited
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      
      if (apt.therapistId !== therapistId || apt.date !== date) return false;
      
      const existingStart = parseISO(`${apt.date}T${apt.startTime}:00`);
      const existingEnd = parseISO(`${apt.date}T${apt.endTime}:00`);
      
      // Check if appointments overlap
      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  // Options for react-select dropdown
  const patientOptions = patients.map(p => ({
    value: p.medicalRecordNumber,
    label: `${p.medicalRecordNumber} - ${p.name} (${p.patientType.toUpperCase()})`,
    patientType: p.patientType,
  }));

  const selectedPatient = patients.find(p => p.medicalRecordNumber === formData.patientId);
  const selectedTherapist = therapists.find(t => t.id === formData.therapistId);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.therapistId) newErrors.therapistId = 'Pilih terapis';
    if (!formData.patientId) newErrors.patientId = 'Pilih pasien';
    if (!formData.date) newErrors.date = 'Pilih tanggal';
    if (!formData.startTime) newErrors.startTime = 'Pilih waktu mulai';

    // Check for scheduling conflicts
    if (formData.therapistId && formData.date && formData.startTime) {
      const hasConflict = checkSchedulingConflict(
        formData.therapistId,
        formData.date,
        formData.startTime,
        formData.sessionType,
        appointment?.id
      );

      if (hasConflict) {
        newErrors.conflict = 'Terapis sudah memiliki jadwal pada waktu tersebut. Pilih waktu lain.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const endTime = calculateEndTime(formData.startTime, formData.sessionType);
    
    const appointmentData: Appointment = {
      id: appointment?.id || `apt-${Date.now()}`,
      therapistId: formData.therapistId,
      patientId: formData.patientId,
      date: formData.date,
      startTime: formData.startTime,
      endTime,
      status: formData.status,
      sessionType: formData.sessionType,
      notes: formData.notes,
    };

    onSave(appointmentData);
    onClose();
  };

  const handleDelete = () => {
    if (appointment && onDelete) {
      onDelete(appointment.id);
      onClose();
    }
  };

  const sendWhatsAppNotification = () => {
    if (selectedPatient && selectedTherapist) {
      const message = `Halo ${selectedPatient.name}, jadwal terapi Anda:\n\nTerapis: ${selectedTherapist.name}\nTanggal: ${format(parseISO(formData.date), 'dd MMMM yyyy')}\nWaktu: ${formData.startTime} - ${calculateEndTime(formData.startTime, formData.sessionType)}\n\nTerima kasih - Klinik Utama Hanenda`;
      
      const whatsappUrl = `https://wa.me/${selectedPatient.contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const timeSlots = generateTimeSlots();
  const availableTimeSlots = timeSlots.filter(slot => isTimeSlotAvailable(slot));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {appointment ? 'Edit Janji Temu' : 'Buat Janji Temu Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Conflict Warning */}
          {errors.conflict && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="text-red-800 text-sm">
                  <strong>Konflik Jadwal:</strong> {errors.conflict}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Therapist Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Terapis
              </label>
              <select
                value={formData.therapistId}
                onChange={(e) => setFormData(prev => ({ ...prev, therapistId: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.therapistId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Terapis</option>
                {therapists.map(therapist => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.name} - {therapist.specialization}
                  </option>
                ))}
              </select>
              {errors.therapistId && <p className="text-red-500 text-sm mt-1">{errors.therapistId}</p>}
            </div>

            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Pasien
              </label>
              {/* Patient dropdown with search (react-select) */}
              <Select
                options={patientOptions}
                placeholder="Pilih atau cari pasien..."
                classNamePrefix="react-select"
                className="w-full"
                value={patientOptions.find(o => o.value === formData.patientId) || null}
                onChange={(option) => {
                  const selected = option as any;
                  if (selected) {
                    setFormData(prev => ({
                      ...prev,
                      patientId: selected.value,
                      sessionType: selected.patientType === 'bpjs' ? 'bpjs' : 'regular',
                    }));
                  } else {
                    setFormData(prev => ({ ...prev, patientId: '' }));
                  }
                }}
              />
              {errors.patientId && <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Tanggal
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Waktu Mulai
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Waktu</option>
                {availableTimeSlots.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
              {formData.therapistId && formData.date && availableTimeSlots.length === 0 && (
                <p className="text-amber-600 text-sm mt-1">
                  Tidak ada waktu tersedia untuk terapis ini pada tanggal yang dipilih
                </p>
              )}
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Sesi
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionType: e.target.value as 'regular' | 'bpjs' }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={selectedPatient?.patientType === 'bpjs'}
              >
                <option value="regular">Reguler (45 menit)</option>
                <option value="bpjs">BPJS (30 menit)</option>
              </select>
            </div>

            {/* Status */}
            {appointment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as AppointmentStatus }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="scheduled">Terjadwal</option>
                  <option value="completed">Selesai</option>
                  <option value="no-show">Tidak Hadir</option>
                  <option value="canceled">Dibatalkan</option>
                </select>
              </div>
            )}
          </div>

          {/* Session Info */}
          {formData.startTime && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Informasi Sesi</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Durasi:</span>
                  <span className="ml-2 font-medium">
                    {formData.sessionType === 'regular' ? '45 menit' : '30 menit'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Waktu Selesai:</span>
                  <span className="ml-2 font-medium">
                    {calculateEndTime(formData.startTime, formData.sessionType)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Catatan
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* Patient Info */}
          {selectedPatient && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Informasi Pasien</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-blue-700">Nama:</span>
                  <span className="ml-2">{selectedPatient.name}</span>
                </div>
                <div>
                  <span className="text-blue-700">Kontak:</span>
                  <span className="ml-2">{selectedPatient.contact}</span>
                </div>
                <div>
                  <span className="text-blue-700">Tipe:</span>
                  <span className="ml-2 uppercase">{selectedPatient.patientType}</span>
                </div>
                {selectedPatient.referralData && (
                  <div>
                    <span className="text-blue-700">Rujukan:</span>
                    <span className="ml-2">{selectedPatient.referralData.referralNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div>
              {appointment && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {appointment && selectedPatient && (
                <button
                  type="button"
                  onClick={sendWhatsAppNotification}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{appointment ? 'Update' : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;