import React, { useState } from 'react';
import { Plus, Edit, User, Phone, Clock, Trash2, Filter, CalendarCheck, Users } from 'lucide-react';
import { Therapist, Specialization, Appointment, Patient } from '../../types';
import { format, parseISO, addMinutes } from 'date-fns';

interface TherapistSettingsProps {
  therapists: Therapist[];
  appointments: Appointment[];
  patients: Patient[];
  onTherapistUpdate: (therapist: Therapist) => void;
  onTherapistAdd: (therapist: Therapist) => void;
  onTherapistDelete: (therapistId: string) => void;
}

const TherapistSettings: React.FC<TherapistSettingsProps> = ({
  therapists,
  appointments,
  patients,
  onTherapistUpdate,
  onTherapistAdd,
  onTherapistDelete,
}) => {
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterSpecialization, setFilterSpecialization] = useState<'all' | Specialization>('all');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTherapistPatients, setSelectedTherapistPatients] = useState<Therapist | null>(null);

  const handleAddNew = () => {
    setEditingTherapist({
      id: `th-${Date.now()}`,
      name: '',
      specialization: 'Terapi Wicara',
      phone: '',
      availability: {
        monday: { available: true, startTime: '08:00', endTime: '17:00' },
        tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
        wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
        thursday: { available: true, startTime: '08:00', endTime: '17:00' },
        friday: { available: true, startTime: '08:00', endTime: '17:00' },
        saturday: { available: false, startTime: '08:00', endTime: '17:00' },
        sunday: { available: false, startTime: '08:00', endTime: '17:00' },
      },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (therapist: Therapist) => {
    setEditingTherapist({ ...therapist });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingTherapist) {
      const existing = therapists.find(t => t.id === editingTherapist.id);
      if (existing) {
        onTherapistUpdate(editingTherapist);
      } else {
        onTherapistAdd(editingTherapist);
      }
      setIsModalOpen(false);
      setEditingTherapist(null);
    }
  };

  const specializations: Specialization[] = ['Terapi Wicara', 'Fisioterapi', 'Terapi Okupasi'];
  const days = [
    { key: 'monday', label: 'Senin' },
    { key: 'tuesday', label: 'Selasa' },
    { key: 'wednesday', label: 'Rabu' },
    { key: 'thursday', label: 'Kamis' },
    { key: 'friday', label: 'Jumat' },
    { key: 'saturday', label: 'Sabtu' },
    { key: 'sunday', label: 'Minggu' },
  ];

  // Helper untuk menghitung slot tersisa pada hari ini untuk seorang terapis
  const getRemainingSlots = (therapist: Therapist, dateString: string) => {
    const dayKey = format(parseISO(dateString), 'EEEE').toLowerCase();
    const availability = therapist.availability[dayKey];
    if (!availability || !availability.available) return 0;

    const sessionDuration = 30; // durasi standar (menit)
    const start = parseISO(`${dateString}T${availability.startTime}:00`);
    const endBoundary = parseISO(`${dateString}T${availability.endTime}:00`);

        const breakStart = parseISO(`${dateString}T12:00:00`);
    const breakEnd = addMinutes(breakStart, 60);

    const slots: Date[] = [];
    let current = start;
    while (addMinutes(current, sessionDuration) <= endBoundary) {
      const slotEndCandidate = addMinutes(current, sessionDuration);
      // lewati slot yang bersinggungan dengan jam istirahat 12:00-13:00
      if (slotEndCandidate <= breakStart || current >= breakEnd) {
        slots.push(current);
      }
      current = addMinutes(current, 30);
    }

    const therapistAppointments = appointments.filter(
      apt => apt.therapistId === therapist.id && apt.date === dateString
    );

    const isSlotFree = (slotStart: Date) => {
      const slotEnd = addMinutes(slotStart, sessionDuration);
      return !therapistAppointments.some(apt => {
        const existingStart = parseISO(`${apt.date}T${apt.startTime}:00`);
        const existingEnd = parseISO(`${apt.date}T${apt.endTime}:00`);
        return slotStart < existingEnd && slotEnd > existingStart;
      });
    };

    return slots.filter(isSlotFree).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Manajemen Terapis</h3>
          <p className="text-gray-600 mt-1">Kelola data terapis dan jadwal ketersediaan</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Terapis</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filterSpecialization}
          onChange={e=>setFilterSpecialization(e.target.value as any)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Semua Spesialisasi</option>
          {specializations.map(spec=> (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

        {/* Date selector */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 w-max"
        />
      </div>

      {/* Therapist List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {therapists
          .filter(t=> filterSpecialization==='all' || t.specialization===filterSpecialization)
          .map(therapist => {
            const remainingSlots = getRemainingSlots(therapist, selectedDate);
            return (
              <div key={therapist.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-secondary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{therapist.name}</h4>
                      <p className="text-sm text-gray-500">{therapist.specialization}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const hasAppointments = appointments.some(a => a.therapistId === therapist.id);
                        if (hasAppointments) {
                          setSelectedTherapistPatients(therapist);
                        } else {
                          alert('Belum ada pasien terjadwal');
                        }
                      }}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      title="Lihat pasien terjadwal"
                    >
                      <Users className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEdit(therapist)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                      title="Edit terapis"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus terapis ${therapist.name}?`)) {
                          onTherapistDelete(therapist.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus terapis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {therapist.phone}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {Object.values(therapist.availability).filter(day => day.available).length} hari tersedia
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    {remainingSlots} slot tersisa hari ini
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Modal daftar pasien terjadwal */}
      {selectedTherapistPatients && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Pasien terjadwal — {selectedTherapistPatients!.name}</h3>
              <button
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setSelectedTherapistPatients(null)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {appointments
                .filter(a => a.therapistId === selectedTherapistPatients!.id)
                .map(app => {
                  const patient = patients.find(p => p.medicalRecordNumber === app.patientId);
                  return (
                    <div key={app.id} className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{patient ? patient.name : 'Pasien tidak ditemukan'}</p>
                        <p className="text-sm text-gray-500">{app.date} • {app.startTime} - {app.endTime}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded-md capitalize">
                        {app.sessionType}
                      </span>
                    </div>
                  );
                })}
              {appointments.filter(a => a.therapistId === selectedTherapistPatients!.id).length === 0 && (
                <p className="text-sm text-gray-500">Tidak ada pasien terjadwal.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal form terapis */}
      {isModalOpen && editingTherapist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {therapists.find(t => t.id === editingTherapist.id) ? 'Edit Terapis' : 'Tambah Terapis Baru'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={editingTherapist.name}
                    onChange={(e) => setEditingTherapist({
                      ...editingTherapist!,
                      name: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Dr. Sarah Amelia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spesialisasi
                  </label>
                  <select
                    value={editingTherapist.specialization}
                    onChange={(e) => setEditingTherapist({
                      ...editingTherapist!,
                      specialization: e.target.value as Specialization
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={editingTherapist.phone}
                    onChange={(e) => setEditingTherapist({
                      ...editingTherapist!,
                      phone: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+62812-3456-7890"
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Jadwal Ketersediaan</h4>
                <div className="space-y-3">
                  {days.map(day => (
                    <div key={day.key} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingTherapist.availability[day.key].available}
                          onChange={(e) => setEditingTherapist({
                            ...editingTherapist!,
                            availability: {
                              ...editingTherapist.availability,
                              [day.key]: {
                                ...editingTherapist.availability[day.key],
                                available: e.target.checked
                              }
                            }
                          })}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700 w-16">
                          {day.label}
                        </label>
                      </div>

                      {editingTherapist.availability[day.key].available && (
                        <div className="flex space-x-2">
                          <input
                            type="time"
                            value={editingTherapist.availability[day.key].startTime}
                            onChange={(e) => setEditingTherapist({
                              ...editingTherapist!,
                              availability: {
                                ...editingTherapist.availability,
                                [day.key]: {
                                  ...editingTherapist.availability[day.key],
                                  startTime: e.target.value
                                }
                              }
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="time"
                            value={editingTherapist.availability[day.key].endTime}
                            onChange={(e) => setEditingTherapist({
                              ...editingTherapist!,
                              availability: {
                                ...editingTherapist.availability,
                                [day.key]: {
                                  ...editingTherapist.availability[day.key],
                                  endTime: e.target.value
                                }
                              }
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTherapist(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistSettings;