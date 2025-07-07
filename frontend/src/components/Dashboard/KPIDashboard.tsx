import React, { useMemo, useState } from 'react';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, addMinutes, isWithinInterval } from 'date-fns';
import { Appointment, Therapist, Patient } from '../../types';

interface KPIDashboardProps {
  appointments: Appointment[];
  therapists: Therapist[];
  patients: Patient[];
}

const SESSION_DURATION = 30; // minutes

// helper to get total available slots for a therapist on a particular date
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

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white shadow-sm rounded-lg p-6 flex flex-col items-start">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

const KPIDashboard: React.FC<KPIDashboardProps> = ({ appointments, therapists, patients }) => {
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  // derive start & end dates
  const today = new Date();
  const startDate = range === '7d' ? new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000) : new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  const endDate = today;

  const { totalAppointments, noShowRate, occupancyRate, newPatients, repeatPatients } = useMemo(() => {
    const interval = { start: startOfDay(startDate), end: endOfDay(endDate) };

    const inRangeAppointments = appointments.filter(a => {
      const apptDate = parseISO(`${a.date}T00:00:00`);
      return isWithinInterval(apptDate, interval);
    });

    const total = inRangeAppointments.length;
    const noShows = inRangeAppointments.filter(a => a.status === 'no-show').length;
    const noShowRateVal = total ? (noShows / total) * 100 : 0;

    // occupancy
    // compute available slots across therapists in range
    let totalAvailable = 0;
    therapists.forEach(therapist => {
      eachDayOfInterval(interval).forEach(d => {
        totalAvailable += getDailyAvailableSlots(therapist, d);
      });
    });
    const occupancyVal = totalAvailable ? (total / totalAvailable) * 100 : 0;

    // new vs repeat patients
    const earliestByPatient: Record<string, string> = {};
    appointments.forEach(a => {
      if (!earliestByPatient[a.patientId] || a.date < earliestByPatient[a.patientId]) {
        earliestByPatient[a.patientId] = a.date;
      }
    });

    let newCount = 0;
    let repeatCount = 0;
    inRangeAppointments.forEach(a => {
      if (earliestByPatient[a.patientId] === a.date) newCount += 1;
      else repeatCount += 1;
    });

    return {
      totalAppointments: total,
      noShowRate: noShowRateVal,
      occupancyRate: occupancyVal,
      newPatients: newCount,
      repeatPatients: repeatCount,
    };
  }, [appointments, therapists, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard KPI</h2>
        <select
          value={range}
          onChange={e => setRange(e.target.value as '7d' | '30d')}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="7d">7 Hari Terakhir</option>
          <option value="30d">30 Hari Terakhir</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Janji Temu" value={`${totalAppointments}`} />
        <StatCard label="No-Show Rate" value={`${noShowRate.toFixed(1)}%`} />
        <StatCard label="Okupansi Terapis" value={`${occupancyRate.toFixed(1)}%`} />
        <StatCard label="Pasien Baru / Lama" value={`${newPatients} / ${repeatPatients}`} />
      </div>
    </div>
  );
};

export default KPIDashboard;
