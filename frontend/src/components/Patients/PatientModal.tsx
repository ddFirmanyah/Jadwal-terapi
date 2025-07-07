import React, { useState, useEffect } from 'react';
import { X, User, Phone, FileText, Calendar, Save } from 'lucide-react';
import { Patient } from '../../types';
import { addDays, format } from 'date-fns';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  onSave: (patient: Patient) => void;
}

const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    medicalRecordNumber: '',
    name: '',
    contact: '',
    patientType: 'regular' as 'regular' | 'bpjs',
    referralNumber: '',
    issuedDate: '',
    referringDoctor: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patient) {
      // Editing existing patient
      setFormData({
        medicalRecordNumber: patient.medicalRecordNumber,
        name: patient.name,
        contact: patient.contact,
        patientType: patient.patientType,
        referralNumber: patient.referralData?.referralNumber || '',
        issuedDate: patient.referralData?.issuedDate || '',
        referringDoctor: patient.referralData?.referringDoctor || '',
      });
    } else {
      // Adding new patient - reset form with empty values
      const newMR = `MR-${String(Date.now()).slice(-6)}`;
      setFormData({
        medicalRecordNumber: newMR,
        name: '',
        contact: '',
        patientType: 'regular',
        referralNumber: '',
        issuedDate: format(new Date(), 'yyyy-MM-dd'),
        referringDoctor: '',
      });
    }
  }, [patient, isOpen]); // Added isOpen to dependency array to reset when modal opens

  const calculateExpiryDate = (issuedDate: string) => {
    if (!issuedDate) return '';
    const issued = new Date(issuedDate);
    const expiry = addDays(issued, 90);
    return format(expiry, 'yyyy-MM-dd');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!formData.contact.trim()) newErrors.contact = 'Kontak wajib diisi';
    
    if (formData.patientType === 'bpjs') {
      if (!formData.referralNumber.trim()) newErrors.referralNumber = 'Nomor rujukan wajib diisi';
      if (!formData.issuedDate) newErrors.issuedDate = 'Tanggal rujukan wajib diisi';
      if (!formData.referringDoctor.trim()) newErrors.referringDoctor = 'Faskes perujuk wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const patientData: Patient = {
      medicalRecordNumber: formData.medicalRecordNumber,
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      patientType: formData.patientType,
    };

    if (formData.patientType === 'bpjs') {
      patientData.referralData = {
        referralNumber: formData.referralNumber.trim(),
        issuedDate: formData.issuedDate,
        expiryDate: calculateExpiryDate(formData.issuedDate),
        referringDoctor: formData.referringDoctor.trim(),
      };
    }

    onSave(patientData);
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      medicalRecordNumber: '',
      name: '',
      contact: '',
      patientType: 'regular',
      referralNumber: '',
      issuedDate: '',
      referringDoctor: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {patient ? 'Edit Pasien' : 'Tambah Pasien Baru'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informasi Dasar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Nomor Rekam Medis
                </label>
                <input
                  type="text"
                  value={formData.medicalRecordNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalRecordNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Pasien
                </label>
                <select
                  value={formData.patientType}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientType: e.target.value as 'regular' | 'bpjs' }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="regular">Reguler</option>
                  <option value="bpjs">BPJS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama lengkap"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                Nomor Kontak
              </label>
              <input
                type="tel"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.contact ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+62812-3456-7890"
              />
              {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
            </div>
          </div>

          {/* BPJS Referral Information */}
          {formData.patientType === 'bpjs' && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Informasi Rujukan BPJS</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Nomor Rujukan
                </label>
                <input
                  type="text"
                  value={formData.referralNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, referralNumber: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.referralNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="REF-2024-001"
                />
                {errors.referralNumber && <p className="text-red-500 text-sm mt-1">{errors.referralNumber}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Tanggal Rujukan
                  </label>
                  <input
                    type="date"
                    value={formData.issuedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issuedDate: e.target.value }))}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.issuedDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.issuedDate && <p className="text-red-500 text-sm mt-1">{errors.issuedDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Tanggal Kadaluarsa
                  </label>
                  <input
                    type="date"
                    value={calculateExpiryDate(formData.issuedDate)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Otomatis 90 hari dari tanggal rujukan</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Faskes Perujuk
                </label>
                <input
                  type="text"
                  value={formData.referringDoctor}
                  onChange={(e) => setFormData(prev => ({ ...prev, referringDoctor: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.referringDoctor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Puskesmas Kramat Jati"
                />
                {errors.referringDoctor && <p className="text-red-500 text-sm mt-1">{errors.referringDoctor}</p>}
              </div>

              {/* Referral Status */}
              {formData.issuedDate && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Status Rujukan</h4>
                  <div className="text-sm text-blue-800">
                    <div>Berlaku: {format(new Date(formData.issuedDate), 'dd MMMM yyyy')}</div>
                    <div>Kadaluarsa: {format(new Date(calculateExpiryDate(formData.issuedDate)), 'dd MMMM yyyy')}</div>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        new Date(calculateExpiryDate(formData.issuedDate)) > new Date()
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {new Date(calculateExpiryDate(formData.issuedDate)) > new Date() ? 'Aktif' : 'Kadaluarsa'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{patient ? 'Update' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;