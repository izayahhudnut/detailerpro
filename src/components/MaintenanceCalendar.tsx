import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MaintenanceJob, getMaintenanceJobs, updateMaintenanceJob } from '../lib/data';
import TaskModal from './TaskModal';

interface ViewProps {
  jobs: MaintenanceJob[];
  date: Date;
  onEventClick: (job: MaintenanceJob) => void;
}

const getStatusColor = (status: MaintenanceJob['status']) => {
  switch (status) {
    case 'not-started':
      return 'border-blue-500 bg-blue-900/50 hover:bg-blue-900/70';
    case 'in-progress':
      return 'border-yellow-500 bg-yellow-900/50 hover:bg-yellow-900/70';
    case 'qa':
      return 'border-purple-500 bg-purple-900/50 hover:bg-purple-900/70';
    case 'done':
      return 'border-green-500 bg-green-900/50 hover:bg-green-900/70';
    default:
      return 'border-gray-500 bg-gray-900/50 hover:bg-gray-900/70';
  }
};

const WeekView: React.FC<ViewProps> = ({ jobs, date, onEventClick }) => {
  const timeSlots = Array.from({ length: 24 }, (_, i) =>
    i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * 64 - 100;
      containerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(date);
    day.setDate(date.getDate() - date.getDay() + i);
    return day;
  });

  const getJobsForDayAndHour = (day: Date, hour: number) => {
    return (jobs || []).filter((job) => {
      const startTime = new Date(job.start_time);
      const endTime = new Date(startTime.getTime() + job.duration * 60 * 60 * 1000);
      const jobDay = startTime.setHours(0, 0, 0, 0);
      const targetDay = day.setHours(0, 0, 0, 0);

      const startsInThisHour = startTime.getHours() === hour && jobDay === targetDay;
      const isOngoing = startTime < new Date(day.setHours(hour)) && 
                       endTime > new Date(day.setHours(hour));

      return startsInThisHour || isOngoing;
    });
  };

  const calculateEventStyle = (job: MaintenanceJob, day: Date) => {
    const startTime = new Date(job.start_time);
    const endTime = new Date(startTime.getTime() + job.duration * 60 * 60 * 1000);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    let height: number;
    let top: number;

    if (startTime < dayStart) {
      top = 0;
      const hoursUntilEndOfDay = Math.min(
        24,
        (endTime.getTime() - dayStart.getTime()) / (1000 * 60 * 60)
      );
      height = Math.min(hoursUntilEndOfDay * 64, 24 * 64 - 8);
    } else if (endTime > dayEnd) {
      top = startTime.getHours() * 64;
      height = (24 - startTime.getHours()) * 64 - 8;
    } else {
      top = startTime.getHours() * 64;
      const durationInHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      height = durationInHours * 64 - 8;
    }

    return { top, height };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-[4rem_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-dark-700 pr-[17px]">
        <div className="h-20"></div>
        {weekDays.map((day, dayIndex) => (
          <div 
            key={dayIndex} 
            className="h-20 flex flex-col justify-center"
          >
            <div className="text-center">
              <div className="font-medium text-dark-100 mb-2">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`mx-auto flex items-center justify-center w-10 h-10 text-sm rounded-full ${
                day.toDateString() === new Date().toDateString()
                  ? 'bg-blue-900 text-blue-100'
                  : 'text-dark-300'
              }`}>
                {day.getDate()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div 
        className="flex-1 overflow-y-auto scrollbar-thin" 
        ref={containerRef}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e293b transparent',
          msOverflowStyle: 'none'
        }}
      >
        <div className="grid grid-cols-[4rem_1fr_1fr_1fr_1fr_1fr_1fr_1fr] pr-[17px]">
          <div className="border-r border-dark-700">
            {timeSlots.map((time, hour) => (
              <div key={hour} className="h-16 flex items-center justify-center text-xs text-dark-400">
                {time}
              </div>
            ))}
          </div>
          {weekDays.map((day, dayIndex) => (
            <div 
              key={dayIndex} 
              className={`relative ${dayIndex < 6 ? 'border-r border-dark-700' : ''}`}
            >
              {timeSlots.map((_, hour) => (
                <div key={hour} className="h-16 border-b border-dark-700">
                  {hour === 23 && <div className="absolute bottom-0 left-0 right-0 h-px bg-dark-700"></div>}
                </div>
              ))}
              {timeSlots.map((_, hour) => {
                const dayJobs = getJobsForDayAndHour(day, hour);
                return dayJobs.map((job) => {
                  const { top, height } = calculateEventStyle(job, day);
                  return (
                    <button
                      key={job.id}
                      onClick={() => onEventClick(job)}
                      className={`absolute inset-x-0 m-1 p-2 border-l-4 rounded text-sm cursor-pointer transition-colors z-10 overflow-hidden ${getStatusColor(
                        job.status
                      )}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        maxHeight: `${24 * 64 - 8}px`,
                      }}
                    >
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs opacity-75">
                        {job.vehicle.model} - {job.employee ? job.employee.name : job.crew ? `Crew: ${job.crew.name}` : 'Unassigned'}
                      </div>
                    </button>
                  );
                });
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DayView: React.FC<ViewProps> = ({ jobs, date, onEventClick }) => {
  const timeSlots = Array.from({ length: 24 }, (_, i) =>
    i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * 64 - 100;
      containerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const getJobsForTimeSlot = (hour: number) => {
    return (jobs || []).filter((job) => {
      const jobDate = new Date(job.start_time);
      return (
        jobDate.getDate() === date.getDate() &&
        jobDate.getMonth() === date.getMonth() &&
        jobDate.getFullYear() === date.getFullYear() &&
        jobDate.getHours() === hour
      );
    });
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="grid grid-cols-[4rem_1fr] h-full overflow-y-auto" ref={containerRef}>
        <div className="border-r">
          {timeSlots.map((time, hour) => (
            <div key={hour} className="h-16 flex items-center justify-center text-xs text-gray-500">
              {time}
            </div>
          ))}
        </div>
        <div>
          {timeSlots.map((_, hour) => (
            <div key={hour} className="h-16 relative">
              {getJobsForTimeSlot(hour).map((job) => (
                <button
                  key={job.id}
                  onClick={() => onEventClick(job)}
                  className={`absolute left-0 right-4 top-0 m-1 p-2 border-l-4 rounded text-sm cursor-pointer transition-colors ${getStatusColor(
                    job.status
                  )}`}
                  style={{ height: `${job.duration * 64 - 8}px` }}
                >
                  <div className="font-medium">{job.title}</div>
                  <div className="text-xs text-gray-600">
                    {job.vehicle.model} - {job.employee ? job.employee.name : job.crew ? `Crew: ${job.crew.name}` : 'Unassigned'}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MonthView: React.FC<ViewProps> = ({ jobs, date, onEventClick }) => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks = [];
  let currentDate = new Date(startDate);

  while (currentDate <= lastDayOfMonth || currentDate.getDay() !== 0) {
    if (currentDate.getDay() === 0) {
      weeks.push([]);
    }
    weeks[weeks.length - 1].push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const getJobsForDate = (day: Date) => {
    return (jobs || []).filter((job) => {
      const jobDate = new Date(job.start_time);
      return (
        jobDate.getDate() === day.getDate() &&
        jobDate.getMonth() === day.getMonth() &&
        jobDate.getFullYear() === day.getFullYear()
      );
    });
  };

  return (
    <div className="grid grid-cols-7 h-full">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="p-2 text-center font-medium text-dark-200 border-b border-dark-700">
          {day}
        </div>
      ))}
      {weeks.map((week, weekIndex) => (
        <React.Fragment key={weekIndex}>
          {week.map((day, dayIndex) => {
            const dayJobs = getJobsForDate(day);
            const isCurrentMonth = day.getMonth() === date.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={dayIndex}
                className={`border-b border-r border-dark-700 p-2 ${
                  isCurrentMonth ? 'bg-dark-800' : 'bg-dark-900'
                } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                <div className={`text-right text-sm mb-2 ${
                  isCurrentMonth ? 'text-dark-200' : 'text-dark-400'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayJobs.slice(0, 3).map((job) => (
                    <button
                      key={job.id}
                      onClick={() => onEventClick(job)}
                      className={`w-full text-left p-1 rounded text-xs ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.title}
                    </button>
                  ))}
                  {dayJobs.length > 3 && (
                    <div className="text-xs text-dark-400">
                      +{dayJobs.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

const YearView: React.FC<ViewProps> = ({ jobs, date, onEventClick }) => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(date.getFullYear(), i, 1);
    return {
      name: monthDate.toLocaleString('default', { month: 'short' }),
      date: monthDate,
    };
  });

  const getJobsForMonth = (monthDate: Date) => {
    return (jobs || []).filter((job) => {
      const jobDate = new Date(job.start_time);
      return (
        jobDate.getMonth() === monthDate.getMonth() &&
        jobDate.getFullYear() === monthDate.getFullYear()
      );
    });
  };

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {months.map((month) => {
        const monthJobs = getJobsForMonth(month.date);
        const isCurrentMonth =
          month.date.getMonth() === new Date().getMonth() &&
          month.date.getFullYear() === new Date().getFullYear();

        return (
          <div
            key={month.name}
            className={`border border-dark-700 bg-dark-800 rounded-lg p-4 ${
              isCurrentMonth ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <h3 className="font-medium text-dark-100 mb-2">{month.name}</h3>
            <div className="space-y-1">
              {monthJobs.slice(0, 5).map((job) => (
                <button
                  key={job.id}
                  onClick={() => onEventClick(job)}
                  className={`w-full text-left p-1 rounded text-xs ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.title}
                </button>
              ))}
              {monthJobs.length > 5 && (
                <div className="text-xs text-dark-400">
                  +{monthJobs.length - 5} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MaintenanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const maintenanceJobs = await getMaintenanceJobs();
        setJobs(maintenanceJobs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load maintenance jobs');
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, []);

  const handleUpdateJob = async (updatedJob: MaintenanceJob) => {
    try {
      const updated = await updateMaintenanceJob(updatedJob.id, updatedJob);
      if (updated) {
        const refreshedJobs = await getMaintenanceJobs();
        setJobs(refreshedJobs);
        setSelectedJob(updated);
      }
    } catch (err) {
      console.error('Error updating job:', err);
      setError('Failed to update maintenance job');
    }
  };

  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(currentDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() - 1);
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(currentDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="h-[calc(100vh-10rem)] bg-dark-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between p-4 bg-dark-800 rounded-t-lg">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl text-dark-50">Maintenance Schedule</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={previousPeriod}
              className="p-1 hover:bg-dark-700 rounded"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium text-dark-100">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <button
              onClick={nextPeriod}
              className="p-1 hover:bg-dark-700 rounded"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-blue-400 hover:bg-dark-700 rounded-lg"
          >
            Today
          </button>
          <select
            className="px-4 py-2 border border-dark-600 rounded-lg bg-dark-800 text-dark-100"
            value={view}
            onChange={(e) =>
              setView(e.target.value as 'day' | 'week' | 'month' | 'year')
            }
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-dark-800 rounded-b-lg shadow-sm">
        {view === 'day' && (
          <DayView
            jobs={jobs}
            date={currentDate}
            onEventClick={setSelectedJob}
          />
        )}
        {view === 'week' && (
          <WeekView
            jobs={jobs}
            date={currentDate}
            onEventClick={setSelectedJob}
          />
        )}
        {view === 'month' && (
          <MonthView
            jobs={jobs}
            date={currentDate}
            onEventClick={setSelectedJob}
          />
        )}
        {view === 'year' && (
          <YearView
            jobs={jobs}
            date={currentDate}
            onEventClick={setSelectedJob}
          />
        )}
      </div>

      {selectedJob && (
        <TaskModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSave={handleUpdateJob}
        />
      )}
    </div>
  );
};

export default MaintenanceCalendar;