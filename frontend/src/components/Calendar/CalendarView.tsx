import React, { useMemo, useEffect } from 'react';
import { format, addDays, eachMinuteOfInterval, parseISO, addMinutes, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, User } from 'lucide-react';
import { Appointment, Therapist, Patient } from '../../types';

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (d: Date) => void;
  appointments: Appointment[];
  therapists: Therapist[];
  patients: Patient[];
  onAppointmentClick: (appointment: Appointment) => void;
  onCreateAppointment: (therapistId: string, date: string, time: string) => void;
  selectedSpecialization: string;
  onSpecializationChange: (specialization: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onDateChange,
  appointments,
  therapists,
  patients,
  onAppointmentClick,
  onCreateAppointment,
  selectedSpecialization,
  onSpecializationChange,
}) => {
  const [selectedTherapist, setSelectedTherapist] = React.useState<string>('');
  
  // Filter therapists based on selected specialization
  const filteredTherapists = useMemo(() => {
    if (selectedSpecialization === 'all') return therapists;
    return therapists.filter(t => t.specialization === selectedSpecialization);
  }, [therapists, selectedSpecialization]);
  
  // Set default selected therapist when filteredTherapists changes
  React.useEffect(() => {
    if (filteredTherapists.length > 0 && !selectedTherapist) {
      setSelectedTherapist(filteredTherapists[0].id);
    } else if (filteredTherapists.length > 0 && !filteredTherapists.some(t => t.id === selectedTherapist)) {
      setSelectedTherapist(filteredTherapists[0].id);
    } else if (filteredTherapists.length === 0) {
      setSelectedTherapist('');
    }
  }, [filteredTherapists, selectedTherapist]);

  // Debug: Log when appointments change
  useEffect(() => {
    console.log('Appointments updated:', {
      count: appointments.length,
      dates: [...new Set(appointments.map(a => a.date))],
      therapists: [...new Set(appointments.map(a => a.therapistId))]
    });
    
    // Log appointments for the current date
    const currentDateStr = format(currentDate, 'yyyy-MM-dd');
    const todayAppointments = appointments.filter(apt => apt.date === currentDateStr);
    console.log(`Appointments for ${currentDateStr}:`, todayAppointments);
  }, [appointments, currentDate]);

  // Debug: Log props
  useEffect(() => {
    console.log('CalendarView mounted with props:', {
      appointmentsCount: appointments.length,
      therapistsCount: therapists.length,
      patientsCount: patients.length
    });
  }, []);

  const specializations = ['all', 'Terapi Wicara', 'Fisioterapi', 'Terapi Okupasi'];

  const SLOT_DURATION = 30; // minutes

  const timeSlots = useMemo(() => {
    const startTime = new Date(currentDate);
    startTime.setHours(8, 0, 0, 0);
    const endTime = new Date(currentDate);
    endTime.setHours(17, 0, 0, 0);
    
    return eachMinuteOfInterval({ start: startTime, end: endTime }, { step: SLOT_DURATION });
  }, [currentDate]);

  // Check if a therapist has any appointment that overlaps with the given time slot
  const isTherapistBusy = (therapistId: string, timeSlot: Date) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const slotStart = timeSlot;
    const slotEnd = addMinutes(timeSlot, SLOT_DURATION);
    
    return appointments.some(apt => {
      // Skip if not for this therapist or date
      if (apt.therapistId !== therapistId || apt.date !== dateStr) return false;
      
      try {
        // Format time strings and parse the appointment times
        const formattedStartTime = formatTimeString(apt.startTime);
        const formattedEndTime = formatTimeString(apt.endTime);
        const aptStart = parseISO(`${apt.date}T${formattedStartTime}`);
        const aptEnd = parseISO(`${apt.date}T${formattedEndTime}`);
        
        if (!isValid(aptStart) || !isValid(aptEnd)) {
          console.error('Invalid date range for appointment in isTherapistBusy:', {
            appointment: apt,
            formattedStartTime,
            formattedEndTime,
            aptStart,
            aptEnd
          });
          return false;
        }
        
        // Check if appointment overlaps with the time slot
        return aptStart < slotEnd && aptEnd > slotStart;
      } catch (error) {
        console.error('Error parsing appointment times in isTherapistBusy:', {
          appointment: apt,
          error
        });
        return false;
      }
    });
  };

  const getAppointmentsForSlot = (therapistId: string, timeSlot: Date) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const slotStart = timeSlot;
    const slotEnd = addMinutes(timeSlot, SLOT_DURATION);
    
    return appointments.filter(apt => {
      // Skip if not for this therapist or date
      if (apt.therapistId !== therapistId || apt.date !== dateStr) return false;
      
      try {
        // Format time strings and parse the appointment times
        const formattedStartTime = formatTimeString(apt.startTime);
        const formattedEndTime = formatTimeString(apt.endTime);
        const aptStart = parseISO(`${apt.date}T${formattedStartTime}`);
        const aptEnd = parseISO(`${apt.date}T${formattedEndTime}`);
        
        if (!isValid(aptStart) || !isValid(aptEnd)) {
          console.error('Invalid date range for appointment in getAppointmentsForSlot:', {
            appointment: apt,
            formattedStartTime,
            formattedEndTime,
            aptStart,
            aptEnd
          });
          return false;
        }
        
        // We only show appointment in the slot where its start time falls
        const inSlot = aptStart >= slotStart && aptStart < slotEnd;
        
        // Debug log
        if (inSlot) {
          console.log('Matching appointment:', {
            appointment: apt,
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            aptStart: aptStart.toISOString(),
            aptEnd: aptEnd.toISOString(),
            formattedStartTime,
            formattedEndTime
          });
        } else {
          console.log('Non-matching appointment:', {
            appointment: apt,
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            aptStart: aptStart.toISOString(),
            aptEnd: aptEnd.toISOString(),
            formattedStartTime,
            formattedEndTime,
            condition1: aptStart < slotEnd,
            condition2: aptEnd > slotStart
          });
        }
        
        return inSlot;
      } catch (error) {
        console.error('Error parsing appointment times:', {
          appointment: apt,
          error
        });
        return false;
      }
    });
  };

  // Format time string to ensure consistent format (HH:mm)
  const formatTimeString = (timeStr: string): string => {
    try {
      // If the time string already has seconds, parse and reformat it
      if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      return timeStr;
    } catch (error) {
      console.error('Error formatting time string:', { timeStr, error });
      return timeStr; // Return original if there's an error
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.medicalRecordNumber === patientId);
    return patient ? `${patient.medicalRecordNumber} - ${patient.name}` : 'Unknown Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'no-show': return 'bg-red-100 text-red-800 border-red-200';
      case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    onDateChange(addDays(currentDate, direction === 'next' ? 1 : -1));
  };

  const handleSlotClick = (therapistId: string, timeSlot: Date) => {
    // Only allow creating appointment if therapist is not busy
    if (!isTherapistBusy(therapistId, timeSlot)) {
      onCreateAppointment(therapistId, format(currentDate, 'yyyy-MM-dd'), format(timeSlot, 'HH:mm'));
    }
  };

  // Format date for mobile view
  const formattedDate = format(currentDate, 'EEEE, dd MMMM yyyy');
  const shortDate = format(currentDate, 'dd/MM/yyyy');
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = format(currentDate, 'yyyy-MM-dd') === today;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => onDateChange(new Date())}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                  isToday 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="flex-1 sm:flex-none">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                <span className="sm:hidden">{shortDate}</span>
                <span className="hidden sm:inline">{formattedDate}</span>
              </h2>
            </div>
          </div>
          
          <div className="w-full sm:w-auto">
            <select
              value={selectedSpecialization}
              onChange={(e) => onSpecializationChange(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>
                  {spec === 'all' ? 'Semua Spesialisasi' : spec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Therapist Tabs */}
      <div className="sm:hidden bg-gray-50 border-b border-gray-200">
        <div className="flex overflow-x-auto px-2 py-1 hide-scrollbar">
          {filteredTherapists.map(therapist => (
            <button
              key={therapist.id}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                selectedTherapist === therapist.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTherapist(therapist.id)}
            >
              {therapist.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden">
        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <div className="min-w-max w-full">
            {/* Header Row */}
            <div 
              className="grid bg-gray-50 border-b border-gray-200"
              style={{
                gridTemplateColumns: `100px repeat(${filteredTherapists.length}, minmax(200px, 1fr))`,
              }}
            >
              <div className="p-3 font-medium text-gray-900 text-sm border-r border-gray-200 sticky left-0 z-10 bg-gray-50">
                Waktu
              </div>
              {filteredTherapists.map(therapist => (
                <div 
                  key={therapist.id} 
                  className="p-3 border-r border-gray-200"
                >
                  <div className="font-medium text-gray-900 text-sm truncate">{therapist.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{therapist.specialization}</div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="divide-y divide-gray-200">
              {timeSlots.map(timeSlot => (
                <div 
                  key={timeSlot.toISOString()} 
                  className="grid"
                  style={{
                    gridTemplateColumns: `100px repeat(${filteredTherapists.length}, minmax(200px, 1fr))`,
                  }}
                >
                  <div className="bg-white p-2 font-medium text-gray-700 text-sm flex items-center border-r border-gray-200 sticky left-0 z-10">
                    <span className="whitespace-nowrap">{format(timeSlot, 'HH:mm')}</span>
                  </div>
                  
                  {filteredTherapists.map(therapist => {
                    const slotAppointments = getAppointmentsForSlot(therapist.id, timeSlot);
                    const isBusy = isTherapistBusy(therapist.id, timeSlot);
                    
                    return (
                      <div
                        key={`${therapist.id}-${timeSlot.toISOString()}`}
                        className={`p-1.5 min-h-[60px] relative transition-colors cursor-pointer border-r border-gray-200 ${
                          isBusy ? 'bg-gray-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSlotClick(therapist.id, timeSlot)}
                      >
                        {slotAppointments.length === 0 ? (
                          <div className={`flex items-center justify-center h-full transition-colors ${
                            isBusy ? 'text-gray-300' : 'text-gray-400 hover:text-primary-500'
                          }`}>
                            {!isBusy && <Plus className="w-4 h-4" />}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {slotAppointments.map(appointment => (
                              <div
                                key={appointment.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAppointmentClick(appointment);
                                }}
                                className={`p-1.5 rounded border text-xs cursor-pointer transition-all hover:shadow-sm ${getStatusColor(appointment.status)}`}
                              >
                                <div className="font-medium truncate">
                                  {appointment.startTime} - {appointment.endTime}
                                </div>
                                <div className="mt-0.5 truncate flex items-center">
                                  <User className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                                  <span className="truncate">{getPatientName(appointment.patientId)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden">
          {filteredTherapists.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Tidak ada terapis tersedia untuk spesialisasi yang dipilih
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {timeSlots.map(timeSlot => {
                const therapist = filteredTherapists.find(t => t.id === selectedTherapist) || filteredTherapists[0];
                if (!therapist) return null;
                
                const slotAppointments = getAppointmentsForSlot(therapist.id, timeSlot);
                const isBusy = isTherapistBusy(therapist.id, timeSlot);
                
                return (
                  <div 
                    key={timeSlot.toISOString()}
                    className="p-3 border-b border-gray-200"
                    onClick={() => !isBusy && handleSlotClick(therapist.id, timeSlot)}
                  >
                    <div className="flex items-start">
                      <div className="w-16 flex-shrink-0">
                        <div className="text-sm font-medium text-gray-900">
                          {format(timeSlot, 'HH:mm')}
                        </div>
                        {isBusy && slotAppointments.length === 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                            Sibuk
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {slotAppointments.length > 0 ? (
                          slotAppointments.map(appointment => (
                            <div
                              key={appointment.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAppointmentClick(appointment);
                              }}
                              className={`p-2 rounded border ${getStatusColor(appointment.status)}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-sm">
                                    {appointment.startTime} - {appointment.endTime}
                                  </div>
                                  <div className="text-xs text-gray-700 mt-1 truncate">
                                    {getPatientName(appointment.patientId)}
                                  </div>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-50">
                                  {appointment.sessionType === 'bpjs' ? 'BPJS' : 'Reguler'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={`h-10 flex items-center justify-center rounded ${
                            isBusy 
                              ? 'bg-gray-50 text-gray-400' 
                              : 'border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-300 hover:text-primary-500'
                          }`}>
                            {!isBusy && <Plus className="w-5 h-5" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;