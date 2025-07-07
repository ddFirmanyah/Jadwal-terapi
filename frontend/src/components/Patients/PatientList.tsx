import React, { useState, useMemo, useEffect } from 'react';
import { Search, Edit, Phone, Calendar, User, FileText, Trash2, Plus } from 'lucide-react';
import { Patient } from '../../types';
import { format, parseISO, differenceInDays } from 'date-fns';

interface ReferralStatus {
  status: 'active' | 'expiring' | 'expired';
  label: string;
  color: string;
}

interface PatientWithRegistration extends Patient {
  registrationDate?: string;
}

interface PatientListProps {
  patients: Patient[];
  onPatientEdit: (patient: Patient) => void;
  onPatientAdd: () => void;
  onPatientDelete: (medicalRecordNumber: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({
  patients,
  onPatientEdit,
  onPatientAdd,
  onPatientDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'regular' | 'bpjs'>('all');
  const [filterReferral, setFilterReferral] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Apply filters and search
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // Text search
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (patient.contact && patient.contact.includes(searchTerm));

      // Type filter
      const matchesType = filterType === 'all' || patient.patientType === filterType;

      // Referral filter
      let matchesReferral = true;
      if (filterReferral !== 'all' && patient.patientType === 'bpjs' && patient.referralData) {
        const expiryDate = parseISO(patient.referralData.expiryDate);
        const today = new Date();
        const daysUntilExpiry = differenceInDays(expiryDate, today);

        switch (filterReferral) {
          case 'active':
            matchesReferral = daysUntilExpiry > 30;
            break;
          case 'expiring':
            matchesReferral = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
            break;
          case 'expired':
            matchesReferral = daysUntilExpiry < 0;
            break;
        }
      }

      return matchesSearch && matchesType && matchesReferral;
    });
  }, [patients, searchTerm, filterType, filterReferral]);

  // Reset to first page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterReferral]);

  // Get referral status for a patient
  const getReferralStatus = (patient: Patient): ReferralStatus | null => {
    if (patient.patientType !== 'bpjs' || !patient.referralData) {
      return null;
    }

    const expiryDate = parseISO(patient.referralData.expiryDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiryDate, today);

    if (daysUntilExpiry < 0) {
      return {
        status: 'expired',
        label: 'Kadaluarsa',
        color: 'bg-red-100 text-red-800',
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'expiring',
        label: `${daysUntilExpiry} hari lagi`,
        color: 'bg-yellow-100 text-yellow-800',
      };
    } else {
      return {
        status: 'active',
        label: 'Aktif',
        color: 'bg-green-100 text-green-800',
      };
    }
  };

  // Handle WhatsApp click
  const sendWhatsApp = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    if (patient.contact) {
      const phoneNumber = patient.contact.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    }
  };

  // Get registration date (fallback to current date if not available)
  const getRegistrationDate = (patient: Patient): string => {
    return (patient as PatientWithRegistration).registrationDate || new Date().toISOString();
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage, itemsPerPage]);

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const maxPageNumbers = 5;
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxPageNumbers) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
      const endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Daftar Pasien</h2>
        <button
          onClick={onPatientAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pasien</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama, no. RM, atau kontak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Semua Tipe</option>
                <option value="regular">Reguler</option>
                <option value="bpjs">BPJS</option>
              </select>
            </div>

            {/* Referral Filter */}
            <div>
              <select
                value={filterReferral}
                onChange={(e) => setFilterReferral(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Semua Rujukan</option>
                <option value="active">Aktif</option>
                <option value="expiring">Akan Kadaluarsa</option>
                <option value="expired">Kadaluarsa</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Patient Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {paginatedPatients.length > 0 ? (
            paginatedPatients.map((patient) => {
              const referralStatus = getReferralStatus(patient);
              
              return (
                <div
                  key={patient.medicalRecordNumber}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onPatientEdit(patient)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-500">RM: {patient.medicalRecordNumber}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => sendWhatsApp(patient, e)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                        title="Kirim WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPatientEdit(patient);
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md"
                        title="Edit Pasien"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus pasien ${patient.name}?`)) {
                            onPatientDelete(patient.medicalRecordNumber);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                        title="Hapus Pasien"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{patient.contact || 'Tidak ada kontak'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Daftar: {format(parseISO(getRegistrationDate(patient)), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      <span>
                        {patient.patientType === 'bpjs' ? 'BPJS' : 'Reguler'}
                        {referralStatus && (
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${referralStatus.color}`}>
                            {referralStatus.label}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {patient.referralData && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center">
                          <FileText className="w-3 h-3 mr-1" />
                          {patient.referralData.referralNumber}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Kadaluarsa: {format(parseISO(patient.referralData.expiryDate), 'dd MMM yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-gray-500">
              Tidak ada data pasien yang sesuai dengan filter
              {patients.length === 0 && (
                <button
                  onClick={onPatientAdd}
                  className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors block mx-auto"
                >
                  Tambah Pasien Pertama
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Menampilkan{' '}
                <span className="font-medium">
                  {filteredPatients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </span>{' '}
                -{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredPatients.length)}
                </span>{' '}
                dari <span className="font-medium">{filteredPatients.length}</span> pasien
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sebelumnya
                </button>
                <div className="flex flex-wrap justify-center gap-1">
                  {pageNumbers.map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...'}
                      className={`min-w-[36px] h-9 flex items-center justify-center rounded-md text-sm font-medium ${
                        page === currentPage
                          ? 'bg-primary-500 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
