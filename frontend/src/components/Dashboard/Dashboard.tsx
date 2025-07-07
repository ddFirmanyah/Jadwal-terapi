import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Appointment, Patient, Therapist } from '../../types';
import { format, parseISO, startOfMonth, startOfDay, endOfDay, isWithinInterval, eachDayOfInterval, addMinutes } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Clock, User, CalendarCheck } from 'lucide-react';

// register chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

interface DashboardProps {
  appointments: Appointment[];
  patients: Patient[];
  therapists: Therapist[];
}

// helper to get available slots for therapist per date
const SESSION_DURATION = 30;
function getDailyAvailableSlots(therapist: Therapist, date: Date) {
  const dayKey = format(date, 'EEEE').toLowerCase() as keyof Therapist['availability'];
  const availability = therapist.availability[dayKey];
  if (!availability || !availability.available) return 0;
  const dateStr = format(date, 'yyyy-MM-dd');
  const start = parseISO(`${dateStr}T${availability.startTime}:00`);
  const end = parseISO(`${dateStr}T${availability.endTime}:00`);
  const breakStart = parseISO(`${dateStr}T12:00:00`);
  const breakEnd = addMinutes(breakStart, 60);
  let count = 0;
  let current = start;
  while (addMinutes(current, SESSION_DURATION) <= end) {
    const slotEnd = addMinutes(current, SESSION_DURATION);
    if (slotEnd <= breakStart || current >= breakEnd) {
      count += 1;
    }
    current = addMinutes(current, SESSION_DURATION);
  }
  return count;
}

const Dashboard: React.FC<DashboardProps> = ({ appointments, patients, therapists }) => {
  const today = new Date();
  const [kpiStart, setKpiStart] = useState(format(new Date(today.getTime() - 6*24*60*60*1000), 'yyyy-MM-dd'));
  const [kpiEnd, setKpiEnd] = useState(format(today, 'yyyy-MM-dd'));
  const todayStr = format(today, 'yyyy-MM-dd');
  const appointmentsToday = appointments.filter(a => a.date === todayStr);

  // current week (Mon-Sun)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const appointmentsWeek = appointments.filter(a => {
    const d = parseISO(a.date);
    return d >= startOfWeek && d <= today;
  });

  // KPI calculations (periode terpilih)
const startRange = parseISO(kpiStart);
  const endRange = parseISO(kpiEnd);
  const intervalRange = { start: startOfDay(startRange), end: endOfDay(endRange) };
  const inRange = appointments.filter(a => isWithinInterval(parseISO(`${a.date}T00:00:00`), intervalRange));
  const totalRange = inRange.length;
  const noShowRange = inRange.filter(a => a.status === 'no-show').length;
  const noShowRate = totalRange ? (noShowRange / totalRange) * 100 : 0;
  let availableSlots = 0;
  therapists.forEach(t => {
    eachDayOfInterval(intervalRange).forEach(d => {
      availableSlots += getDailyAvailableSlots(t, d);
    });
  });
  const occupancy = availableSlots ? (totalRange / availableSlots) * 100 : 0;
  const earliest: Record<string, string> = {};
  appointments.forEach(a => { if (!earliest[a.patientId] || a.date < earliest[a.patientId]) earliest[a.patientId] = a.date; });
  let newPatients = 0, repeatPatients = 0;
  inRange.forEach(a => { earliest[a.patientId] === a.date ? newPatients++ : repeatPatients++; });


// current month cancellations & no-show
  const monthStart = startOfMonth(today);
  const canceledNoShow = appointments.filter(a => {
    const d = parseISO(a.date);
    return d >= monthStart && (a.status === 'canceled' || a.status === 'no-show');
  });

  // generate chart data
  const last30Dates: string[] = Array.from({ length: 30 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - idx));
    return format(d, 'yyyy-MM-dd');
  });
  const dailyCounts = last30Dates.map(ds => appointments.filter(a => a.date === ds).length);

  const lineData = {
    labels: last30Dates.map(d => format(parseISO(d), 'dd/MM')),
    datasets: [
      {
        label: 'Janji',
        data: dailyCounts,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.2)',
        tension: 0.3,
      },
    ],
  };

  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);
  const therapistNames = therapists.map(t => t.name);
  const barData = {
    labels: therapistNames,
    datasets: [
      {
        label: 'Janji minggu ini',
        data: therapistNames.map(name => {
          const th = therapists.find(t => t.name === name)!;
          return appointments.filter(a => a.therapistId === th.id && parseISO(a.date) >= currentWeekStart).length;
        }),
        backgroundColor: '#10b981',
      },
    ],
  };

  const bpjs = patients.filter(p => p.patientType === 'bpjs').length;
  const regular = patients.length - bpjs;

  const pieData = {
    labels: ['BPJS','Regular'],
    datasets:[{
      data:[bpjs,regular],
      backgroundColor:['#f59e0b','#6366f1'],
    }]
  };

  // specialization distribution for current week
  const specLabels = ['Terapi Wicara','Fisioterapi','Terapi Okupasi'];
  const specData = specLabels.map(spec => {
    const thIds = therapists.filter(t => t.specialization === spec).map(t => t.id);
    return appointments.filter(a => thIds.includes(a.therapistId) && parseISO(a.date) >= currentWeekStart).length;
  });
  const specChart = {
    labels: specLabels,
    datasets: [
      {
        label: 'Janji',
        data: specData,
        backgroundColor: ['#6366f1','#ef4444','#10b981'],
      },
    ],
  };

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Dari:</span>
            <input 
              type="date" 
              value={kpiStart} 
              max={kpiEnd} 
              onChange={e => setKpiStart(e.target.value)} 
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Sampai:</span>
            <input 
              type="date" 
              value={kpiEnd} 
              min={kpiStart} 
              onChange={e => setKpiEnd(e.target.value)} 
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pasien" value={patients.length} />
        <StatCard label="Janji Hari Ini" value={appointmentsToday.length} />
        <StatCard label="Janji Minggu Ini" value={appointmentsWeek.length} />
        <StatCard label="Batal/Tidak Hadir" value={canceledNoShow.length} subLabel="bulan ini" />
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Janji" value={totalRange} subLabel={`${kpiStart} s/d ${kpiEnd}`} />
        <StatCard label="No-Show Rate" value={`${noShowRate.toFixed(1)}%`} subLabel={`dari ${totalRange} janji`} />
        <StatCard label="Okupansi Terapis" value={`${occupancy.toFixed(1)}%`} subLabel="dari slot tersedia" />
        <StatCard label="Pasien Baru / Lama" value={`${newPatients} / ${repeatPatients}`} subLabel={`periode ${kpiStart} - ${kpiEnd}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Trend Janji (30 hari terakhir)</h3>
          <div className="h-64">
            <Line 
              data={lineData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }} 
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Distribusi Pasien</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie 
              data={pieData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }} 
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Janji per Spesialisasi (minggu ini)</h3>
          <div className="h-64">
            <Bar 
              data={specChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true }
                },
                plugins: {
                  legend: { display: false }
                }
              }} 
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Janji per Terapis (minggu ini)</h3>
          <div className="h-64">
            <Bar 
              data={barData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true }
                },
                plugins: {
                  legend: { display: false }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Janji Mendatang</h3>
        </div>
        <UpcomingTable 
          appointments={appointments
            .filter(a => parseISO(a.date) >= today)
            .sort((a, b) => {
              const dateA = parseISO(a.date + 'T' + a.startTime);
              const dateB = parseISO(b.date + 'T' + b.startTime);
              return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 5)} 
          patients={patients} 
          therapists={therapists} 
        />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: React.ReactNode; subLabel?: string }> = ({ label, value, subLabel }) => (
  <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100 hover:border-primary-100 transition-colors">
    <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm font-medium text-gray-900">{label}</p>
    {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
  </div>
);

interface UpTableProps {
  appointments: Appointment[];
  patients: Patient[];
  therapists: Therapist[];
}

const UpcomingTable: React.FC<UpTableProps> = ({ appointments, patients, therapists }) => {
  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hari Ini';
    } else if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Besok';
    } else {
      return format(date, 'EEE, d MMM yyyy');
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pasien</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terapis</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map(ap => {
              const patient = patients.find(p => p.medicalRecordNumber === ap.patientId);
              const therapist = therapists.find(t => t.id === ap.therapistId);
              const appointmentDate = parseISO(ap.date);
              const isToday = format(appointmentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              let statusClass = 'bg-gray-100 text-gray-800';
              if (ap.status === 'completed') statusClass = 'bg-green-100 text-green-800';
              else if (ap.status === 'canceled') statusClass = 'bg-red-100 text-red-800';
              else if (ap.status === 'no-show') statusClass = 'bg-yellow-100 text-yellow-800';
              else if (isToday) statusClass = 'bg-blue-100 text-blue-800';

              return (
                <tr key={ap.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{formatDate(ap.date)}</span>
                      <span className="text-xs text-gray-500">{format(appointmentDate, 'EEEE', { locale: id })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-gray-900">{ap.startTime} - {ap.endTime}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient?.name || '—'}</div>
                        <div className="text-xs text-gray-500">{patient?.contact || 'No HP tidak tersedia'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{therapist?.name || '—'}</div>
                    <div className="text-xs text-gray-500">{therapist?.specialization || '—'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                      {ap.status === 'scheduled' ? (isToday ? 'Hari Ini' : 'Terjadwal') : 
                       ap.status === 'completed' ? 'Selesai' : 
                       ap.status === 'canceled' ? 'Dibatalkan' : 'Tidak Hadir'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <CalendarCheck className="h-8 w-8 text-gray-400" />
                    <p>Tidak ada janji mendatang</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden">
        {appointments.length === 0 ? (
          <div className="text-center py-8 px-4">
            <CalendarCheck className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Tidak ada janji mendatang</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.map(ap => {
              const patient = patients.find(p => p.medicalRecordNumber === ap.patientId);
              const therapist = therapists.find(t => t.id === ap.therapistId);
              const appointmentDate = parseISO(ap.date);
              const isToday = format(appointmentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              let statusClass = 'bg-gray-100 text-gray-800';
              if (ap.status === 'completed') statusClass = 'bg-green-100 text-green-800';
              else if (ap.status === 'canceled') statusClass = 'bg-red-100 text-red-800';
              else if (ap.status === 'no-show') statusClass = 'bg-yellow-100 text-yellow-800';
              else if (isToday) statusClass = 'bg-blue-100 text-blue-800';

              return (
                <div key={ap.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{patient?.name || '—'}</div>
                      <div className="mt-1 text-sm text-gray-500">{therapist?.name || '—'}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                      {ap.status === 'scheduled' ? (isToday ? 'Hari Ini' : 'Terjadwal') : 
                       ap.status === 'completed' ? 'Selesai' : 
                       ap.status === 'canceled' ? 'Dibatalkan' : 'Tidak Hadir'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span>{formatDate(ap.date)}</span>
                    <span className="mx-2">•</span>
                    <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span>{ap.startTime} - {ap.endTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
