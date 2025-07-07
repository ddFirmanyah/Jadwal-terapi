import React, { useState, useMemo } from 'react';
import { FileText, Download, Calendar, Users, AlertTriangle, BarChart3 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Appointment, Patient, Therapist } from '../../types';

interface ReportGeneratorProps {
  appointments: Appointment[];
  patients: Patient[];
  therapists: Therapist[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  appointments,
  patients,
  therapists,
}) => {
  const [selectedReport, setSelectedReport] = useState<string>('daily');
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterTherapist, setFilterTherapist] = useState<string>('all');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');

  // Unique specialization list for dropdown
  const specializationOptions = useMemo(() => {
    const specs = Array.from(new Set(therapists.map(t => t.specialization))).filter(Boolean);
    return specs;
  }, [therapists]);



  // Generate patient attendance report
  const generateAttendanceReport = (dateStr: string) => {
  // Filter appointments on selected date
  const apptsOnDate = appointments.filter(apt => apt.date === dateStr);
  const patientsOnDate = Array.from(new Set(apptsOnDate.map(a => a.patientId)));

  const patientStats = patients
    .filter(p => patientsOnDate.includes(p.medicalRecordNumber))
    .map(patient => {
      const patientAppointments = apptsOnDate.filter(apt => apt.patientId === patient.medicalRecordNumber);
      const completed = patientAppointments.filter(apt => apt.status === 'completed').length;
      const noShow = patientAppointments.filter(apt => apt.status === 'no-show').length;
      const canceled = patientAppointments.filter(apt => apt.status === 'canceled').length;
      const total = patientAppointments.length;
      
      return {
        noRekamMedis: patient.medicalRecordNumber,
        nama: patient.name,
        tipe: patient.patientType.toUpperCase(),
        totalJanji: total,
        selesai: completed,
        tidakHadir: noShow,
        dibatalkan: canceled,
        tingkatKehadiran: total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0%',
        kontak: patient.contact,
      };
    });
    
    return patientStats.sort((a, b) => b.totalJanji - a.totalJanji);
  };

  // Generate expiring referrals report
  const generateExpiringReferralsReport = () => {
    return patients
      .filter(patient => patient.patientType === 'bpjs' && patient.referralData)
      .map(patient => {
        const referral = patient.referralData!;
        const expiryDate = parseISO(referral.expiryDate);
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());
        
        return {
          noRekamMedis: patient.medicalRecordNumber,
          nama: patient.name,
          noRujukan: referral.referralNumber,
          dokterPerujuk: referral.referringDoctor,
          tanggalRujukan: format(parseISO(referral.issuedDate), 'dd/MM/yyyy'),
          tanggalKadaluarsa: format(expiryDate, 'dd/MM/yyyy'),
          sisaHari: daysUntilExpiry,
          status: daysUntilExpiry < 0 ? 'Kadaluarsa' : daysUntilExpiry <= 30 ? 'Akan Kadaluarsa' : 'Aktif',
          kontak: patient.contact,
        };
      })
      .sort((a, b) => a.sisaHari - b.sisaHari);
  };

  // Generate provider statistics report
  const generateProviderReport = () => {
    return therapists.map(therapist => {
      const therapistAppointments = appointments.filter(apt => apt.therapistId === therapist.id);
      const today = therapistAppointments.filter(apt => apt.date === format(new Date(), 'yyyy-MM-dd'));
      const completed = therapistAppointments.filter(apt => apt.status === 'completed').length;
      const scheduled = therapistAppointments.filter(apt => apt.status === 'scheduled').length;
      
      return {
        nama: therapist.name,
        spesialisasi: therapist.specialization,
        totalJanji: therapistAppointments.length,
        hariIni: today.length,
        selesai: completed,
        terjadwal: scheduled,
        kontak: therapist.phone,
      };
    }).sort((a, b) => b.totalJanji - a.totalJanji);
  };

  // Export to Excel
  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    if (data.length === 0) return;

    // Sort same order as PDF
    const sorted = [...data].sort((a, b) => {
      const s = (a.spesialisasi || '').localeCompare(b.spesialisasi || '');
      if (s !== 0) return s;
      const t = (a.terapis || '').localeCompare(b.terapis || '');
      if (t !== 0) return t;
      return (a.waktu || '').localeCompare(b.waktu || '');
    });

    const allKeys = Object.keys(sorted[0]);
    const columns = allKeys.filter(k => k !== 'spesialisasi' && k !== 'terapis');

    const aoa: any[][] = [];
    const merges: any[] = [];
    let lastSpec = '';
    let lastTerap = '';
    let rowIdx = 0;

    sorted.forEach(r => {
      if (r.spesialisasi !== lastSpec) {
        aoa.push([`SPESIALISASI : ${r.spesialisasi}`]);
        merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: columns.length - 1 } });
        rowIdx++;
        lastSpec = r.spesialisasi;
        lastTerap = '';
      }
      if (r.terapis !== lastTerap) {
        aoa.push([`Nama Terapis: ${r.terapis}`]);
        merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: columns.length - 1 } });
        rowIdx++;
        lastTerap = r.terapis;
      }
      aoa.push(columns.map(h => r[h] || ''));
      rowIdx++;
    });

    // Prepend column headers after building rows for easier column width calculation
    aoa.unshift(columns);
    merges.forEach(m => { m.s.r += 1; m.e.r += 1; });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = merges;

    // Style header row bold
    columns.forEach((_, c) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cellRef]) ws[cellRef].s = { font: { bold: true } } as any;
    });

    // Auto column width
    ws['!cols'] = columns.map((k, idx) => {
      const maxLen = Math.max(k.length, ...aoa.slice(1).map(r => String(r[idx]).length));
      return { wch: maxLen + 2 };
    });

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = (data: any[], title: string, filename: string) => {
    if (data.length === 0) return;

    // Sort spesialisasi ➜ terapis ➜ waktu
    const sorted = [...data].sort((a: any, b: any) => {
      const s = (a.spesialisasi || '').localeCompare(b.spesialisasi || '');
      if (s !== 0) return s;
      const t = (a.terapis || '').localeCompare(b.terapis || '');
      if (t !== 0) return t;
      return (a.waktu || '').localeCompare(b.waktu || '');
    });

    // Build table rows with heading rows
    const headers = Object.keys(sorted[0] || {});
    const rows: any[] = [];
    let lastSpec = '';
    let lastTerap = '';
    sorted.forEach(r => {
      if (r.spesialisasi !== lastSpec) {
        rows.push([{ content: `SPESIALISASI : ${r.spesialisasi}`, colSpan: headers.length, styles: { halign: 'center', fontStyle: 'bold' } }]);
        lastSpec = r.spesialisasi;
        lastTerap = '';
      }
      if (r.terapis !== lastTerap) {
        rows.push([{ content: `Nama Terapis: ${r.terapis}`, colSpan: headers.length, styles: { fontStyle: 'bold' } }]);
        lastTerap = r.terapis;
      }
      rows.push(headers.map(h => r[h] || ''));
    });
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Klinik Utama Hanenda', 20, 20);
    doc.setFontSize(14);
    doc.text(title, 20, 30);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 20, 40);
    
    // Table
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [255, 176, 124], // Primary color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
    });
    
    doc.save(`${filename}.pdf`);
  };

  const getReportData = () => {
    const applyFilters = (apts: Appointment[]) => apts.filter(apt => {
      if (filterTherapist !== 'all' && apt.therapistId !== filterTherapist) return false;
      const therapist = therapists.find(t => t.id === apt.therapistId);
      if (filterSpecialization !== 'all' && therapist?.specialization !== filterSpecialization) return false;
      return true;
    });
    switch (selectedReport) {
      case 'daily': {
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const apts = applyFilters(appointments)
          .filter(a => a.date === dateStr)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return apts.map(apt => {
          const therapist = therapists.find(t=>t.id===apt.therapistId);
          const patient = patients.find(p=>p.medicalRecordNumber===apt.patientId);
          return {
            waktu: `${apt.startTime} - ${apt.endTime}`,
            terapis: therapist?.name || 'Unknown',
            spesialisasi: therapist?.specialization || 'Unknown',
            pasien: patient?.name || 'Unknown',
            tipe: apt.sessionType.toUpperCase(),
            status: apt.status,
            kontak: patient?.contact || '',
            noRekamMedis: patient?.medicalRecordNumber || '',
          };
        });
      }
      case 'tomorrow': {
        const dateStr = format(new Date(Date.now() + 24*60*60*1000), 'yyyy-MM-dd');
        const apts = applyFilters(appointments)
          .filter(a => a.date === dateStr)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return apts.map(apt => {
          const therapist = therapists.find(t=>t.id===apt.therapistId);
          const patient = patients.find(p=>p.medicalRecordNumber===apt.patientId);
          return {
            waktu: `${apt.startTime} - ${apt.endTime}`,
            terapis: therapist?.name || 'Unknown',
            spesialisasi: therapist?.specialization || 'Unknown',
            pasien: patient?.name || 'Unknown',
            tipe: apt.sessionType.toUpperCase(),
            status: apt.status,
            kontak: patient?.contact || '',
            noRekamMedis: patient?.medicalRecordNumber || '',
          };
        });
      }
      case 'custom': {
        const apts = applyFilters(appointments)
          .filter(a => a.date === customDate)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return apts.map(apt => {
          const therapist = therapists.find(t=>t.id===apt.therapistId);
          const patient = patients.find(p=>p.medicalRecordNumber===apt.patientId);
          return {
            waktu: `${apt.startTime} - ${apt.endTime}`,
            terapis: therapist?.name || 'Unknown',
            spesialisasi: therapist?.specialization || 'Unknown',
            pasien: patient?.name || 'Unknown',
            tipe: apt.sessionType.toUpperCase(),
            status: apt.status,
            kontak: patient?.contact || '',
            noRekamMedis: patient?.medicalRecordNumber || '',
          };
        });
      }
      case 'attendance':
        return generateAttendanceReport(attendanceDate);
      case 'referrals':
        return generateExpiringReferralsReport();
      case 'providers':
        return generateProviderReport();
      default:
        return [];
    }
  };

  const getReportTitle = () => {
    switch (selectedReport) {
      case 'daily':
        return `Laporan Jadwal Harian - ${format(new Date(), 'dd MMMM yyyy')}`;
      case 'tomorrow':
        return `Laporan Jadwal Besok - ${format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'dd MMMM yyyy')}`;
      case 'custom':
        return `Laporan Jadwal - ${format(parseISO(customDate), 'dd MMMM yyyy')}`;
      case 'attendance':
        return `Laporan Kehadiran Pasien - ${format(parseISO(attendanceDate), 'dd MMMM yyyy')}`;
      case 'referrals':
        return 'Laporan Rujukan BPJS';
      case 'providers':
        return 'Laporan Statistik Terapis';
      default:
        return 'Laporan';
    }
  };

  const reportData = getReportData();
  const reportTitle = getReportTitle();

  // Sorted rows + header rows for front-end display
  const displayRows = useMemo(() => {
    if (reportData.length === 0) return [];

    // Ensure consistent ordering first
    const sorted = [...reportData].sort((a: any, b: any) => {
      const specDiff = (a.spesialisasi || '').localeCompare(b.spesialisasi || '');
      if (specDiff !== 0) return specDiff;
      const therapistDiff = (a.terapis || '').localeCompare(b.terapis || '');
      if (therapistDiff !== 0) return therapistDiff;
      const timeDiff = (a.waktu || '').localeCompare(b.waktu || '');
      return timeDiff;
    });

    // Build rows with custom header objects
    const result: any[] = [];
    let lastSpec = '';
    let lastTerap = '';
    sorted.forEach((row: any) => {
      if (row.spesialisasi !== lastSpec) {
        result.push({ __header: true, spesialisasi: row.spesialisasi, terapis: row.terapis });
        lastSpec = row.spesialisasi;
        lastTerap = row.terapis; // set to current to avoid duplicate header
      } else if (row.terapis !== lastTerap) {
        result.push({ __header: true, spesialisasi: row.spesialisasi, terapis: row.terapis });
        lastTerap = row.terapis;
      }
      result.push(row);
    });
    return result;
  }, [reportData]);

  const reportTypes = [
    { id: 'daily', label: 'Jadwal Hari Ini', icon: Calendar },
    { id: 'tomorrow', label: 'Jadwal Besok', icon: Calendar },
    { id: 'custom', label: 'Jadwal Tanggal Tertentu', icon: Calendar },
    { id: 'attendance', label: 'Kehadiran Pasien', icon: Users },
    { id: 'referrals', label: 'Rujukan BPJS', icon: AlertTriangle },
    { id: 'providers', label: 'Statistik Terapis', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Laporan</h2>
        <p className="text-gray-600 mt-1">Generate dan export laporan klinik</p>
      </div>

      {/* Report Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pilih Jenis Laporan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {reportTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  selectedReport === type.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <div className="font-medium">{type.label}</div>
              </button>
            );
          })}
        </div>

        {/* Custom Date Picker */}
        {selectedReport === 'custom' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Tanggal
            </label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Attendance Date Picker */}
        {selectedReport === 'attendance' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Tanggal
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Filters */}
        {['daily','tomorrow','custom'].includes(selectedReport) && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Therapist Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter Terapis</label>
              <select
                value={filterTherapist}
                onChange={e=>setFilterTherapist(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              >
                <option value="all">Semua Terapis</option>
                {therapists.map(t=> (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {/* Specialization Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter Spesialisasi</label>
              <select
                value={filterSpecialization}
                onChange={e=>setFilterSpecialization(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              >
                <option value="all">Semua Spesialisasi</option>
                {specializationOptions.map(spec=> (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => exportToExcel(reportData, `${selectedReport}-report`, 'Laporan')}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
            disabled={reportData.length === 0}
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={() => exportToPDF(reportData, reportTitle, `${selectedReport}-report`)}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2"
            disabled={reportData.length === 0}
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{reportTitle}</h3>
            <span className="text-sm text-gray-500">
              {reportData.length} records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {displayRows.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(displayRows.find(r=>!r.__header) || {}).map(key => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayRows.map((row, index) => {
                  if (row.__header) {
                    return (
                      <tr key={`h-${index}`} className="bg-primary-50">
                        <td colSpan={Object.keys(displayRows.find(r=>!r.__header) || {}).length} className="px-6 py-2 text-sm font-semibold text-primary-700">
                          {row.spesialisasi} — {row.terapis}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
              <p className="text-gray-500">Tidak ada data untuk laporan yang dipilih</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;