import React, { useState, useEffect } from 'react';
import { X, Plus, Car, Users, Calendar, Clock, ChevronDown, UserSquare2 } from 'lucide-react';
import { getEmployees, getVehicles, addMaintenanceJob, getProgressTemplates, getCrews } from '../lib/data';
import type { Employee, Vehicle, MaintenanceJob, ProgressTemplate, Crew } from '../lib/data';
import CreateTemplateModal from './CreateTemplateModal';

interface CreateJobModalProps {
  onClose: () => void;
  onJobCreated?: () => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ onClose, onJobCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    vehicleId: '',
    employeeId: '',
    crewId: '',
    startTime: '',
    duration: '',
    template_id: '',
    notification_phone: ''
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [templates, setTemplates] = useState<ProgressTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatLocalDateTime = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      setFormData(prev => ({
        ...prev,
        startTime: formatLocalDateTime(newDate)
      }));
    }
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeesData = await getEmployees();
        const activeEmployees = Array.isArray(employeesData)
          ? employeesData.filter(emp => emp.status === 'active')
          : [];
        const vehiclesData = await getVehicles();
        const crewsData = await getCrews();

        setEmployees(activeEmployees);
        setVehicles(vehiclesData || []);
        setCrews(crewsData || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await getProgressTemplates();
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      } catch (err) {
        console.error('Error loading templates:', err);
        setError('Failed to load progress templates');
        setTemplates([]); // Ensure templates is always an array even on error
      }
    };

    loadTemplates();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const localDate = new Date(formData.startTime);
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      const selectedEmployee = formData.employeeId ? employees.find(e => e.id === formData.employeeId) : null;
      const selectedCrew = formData.crewId ? crews.find(c => c.id === formData.crewId) : null;

      if (!selectedVehicle) {
        throw new Error('Invalid vehicle selection');
      }

      // Require either an employee or a crew
      if (!selectedEmployee && !selectedCrew) {
        throw new Error('You must select either a staff member or a crew');
      }

      const newJob = await addMaintenanceJob({
        title: formData.title,
        description: formData.description,
        vehicle_id: formData.vehicleId,
        employee_id: formData.employeeId || undefined,
        crew_id: formData.crewId || undefined,
        start_time: localDate.toISOString(),
        duration: parseInt(formData.duration, 10),
        status: 'not-started',
        template_id: formData.template_id || undefined,
        notification_phone: notificationsEnabled ? formData.notification_phone : null,
        vehicle: selectedVehicle,
        employee: selectedEmployee ? {
          name: selectedEmployee.name,
          specialization: selectedEmployee.specialization
        } : undefined
      });

      if (onJobCreated) {
        onJobCreated();
      }

      // Refresh the page after successful creation
      window.location.reload();

      onClose();
    } catch (err) {
      console.error('Error creating maintenance job:', err);
      setError('Failed to create maintenance job');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 border border-dark-700">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-dark-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-dark-700 rounded"></div>
              <div className="h-4 bg-dark-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-end mb-3">
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Task Title"
              className="w-full bg-dark-700 text-xl font-medium text-dark-50 rounded-lg px-4 py-3 border border-dark-600 focus:outline-none focus:border-blue-500"
              required
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add task description..."
              className="w-full bg-dark-700 text-dark-100 rounded-lg px-4 py-3 border border-dark-600 focus:outline-none focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          <div className="space-y-4 mt-5">
            <div className="flex items-center space-x-3">
              <Car className="text-dark-400" size={20} />
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleChange}
                className="w-full bg-dark-700 text-dark-100 rounded-lg px-4 py-3 border border-dark-600 focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select vehicle</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model} ({v.registration})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="text-dark-400" size={20} />
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="w-full bg-dark-700 text-dark-100 rounded-lg px-4 py-3 border border-dark-600 focus:outline-none focus:border-blue-500"
                required={!formData.crewId}
              >
                <option value="">Select staff member {formData.crewId ? '(optional with crew)' : ''}</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <UserSquare2 className="text-dark-400" size={20} />
              <select
                name="crewId"
                value={formData.crewId}
                onChange={handleChange}
                className="w-full bg-dark-700 text-dark-100 rounded-lg px-4 py-3 border border-dark-600 focus:outline-none focus:border-blue-500"
                required={!formData.employeeId}
              >
                <option value="">Select crew {formData.employeeId ? '(optional)' : '(required if no staff member)'}</option>
                {crews.map(crew => (
                  <option key={crew.id} value={crew.id}>
                    {crew.name} {crew.member_count ? `(${crew.member_count} members)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full text-left px-4 py-3 bg-dark-700 rounded-lg border border-dark-600 hover:bg-dark-600 focus:outline-none"
                  >
                    <div className="text-sm text-dark-100">
                      {formData.startTime ? formatDate(new Date(formData.startTime)) : 'Select date and time'}
                    </div>
                  </button>
                  {showDatePicker && (
                    <div className="absolute mt-2 bg-dark-800 rounded-lg shadow-xl border border-dark-700 p-4 z-20">
                      <div className="space-y-4">
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-50" size={16} />
                          <input
                            type="date"
                            value={new Date(formData.startTime || Date.now()).toISOString().split('T')[0]}
                            onChange={(e) => {
                              const [year, month, day] = e.target.value.split('-').map(Number);
                              setSelectedDate(new Date(year, month - 1, day));
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50"
                          />
                        </div>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-50" size={16} />
                          <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {formData.startTime && (
                <div className="flex items-center gap-2 ml-7">
                  <span className="text-sm text-dark-200">
                    {formatTime(formData.startTime)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 ml-7">
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                step="1"
                placeholder="Duration (hours)"
                className="w-full bg-dark-700 text-dark-100 rounded-lg px-4 py-3 border border-dark-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2"
            >
              Advanced
              <ChevronDown
                size={16}
                className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-dark-700 rounded-lg">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-dark-100">
                      Progress Template
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Create New Template
                    </button>
                  </div>
                  <select
                    name="template_id"
                    value={formData.template_id}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-dark-100"
                  >
                    <option value="">Select a template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {formData.template_id && templates.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-dark-100 mb-2">Template Steps:</h4>
                      <div className="space-y-2">
                        {templates
                          .find(t => t.id === formData.template_id)
                          ?.steps?.map(step => (
                            <div key={step.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center text-sm">
                                {step.order_number}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-dark-100">{step.title}</p>
                                {step.description && (
                                  <p className="text-xs text-dark-300">{step.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-dark-100">
                      Client Notifications
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input 
                        type="checkbox" 
                        id="toggle"
                        checked={notificationsEnabled}
                        onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                        className="sr-only"
                      />
                      <label 
                        htmlFor="toggle" 
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in ${notificationsEnabled ? 'bg-blue-600' : 'bg-dark-600'}`}
                      >
                        <span 
                          className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  
                  {notificationsEnabled && (
                    <>
                      <input
                        type="tel"
                        name="notification_phone"
                        value={formData.notification_phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 555-5555"
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-dark-100"
                      />
                      <p className="mt-1 text-sm text-dark-300">
                        Enter a phone number to receive progress updates via SMS
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700"
            >
              Create Job
            </button>
          </div>
        </form>
      </div>

      {showTemplateModal && (
        <CreateTemplateModal
          onClose={() => setShowTemplateModal(false)}
          onTemplateCreated={async () => {
            try {
              const templatesData = await getProgressTemplates();
              setTemplates(Array.isArray(templatesData) ? templatesData : []);
            } catch (err) {
              console.error('Error refreshing templates:', err);
              setTemplates([]);
            }
          }}
        />
      )}
    </div>
  );
};

export default CreateJobModal;