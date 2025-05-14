import React, { useState, useEffect } from 'react';
import { User, Plane, Calendar, Plus, Trash2, Edit2, X, Shield, Clock, Mail, Phone, Award, Search, UserX, UserCheck, Eye, EyeOff, DollarSign, Users, ChevronRight, UserPlus, Star, Group, Check } from 'lucide-react';
import { 
  getMaintenanceJobs, 
  getEmployees, 
  updateEmployee, 
  deleteEmployee, 
  addEmployee,
  getCrews,
  getCrewWithMembers,
  addCrew,
  updateCrew,
  deleteCrew,
  addCrewMember,
  removeCrewMember,
  updateCrewMemberRole
} from '../lib/data';
import type { Employee, MaintenanceJob, Crew, CrewWithMembers, CrewMember } from '../lib/data';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface EmployeeModalProps {
  employee?: Employee;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ employee, onClose, onSave }) => {
  const [formData, setFormData] = useState<Employee & {cost_per_hour_input?: string}>(
    employee ? {
      ...employee,
      cost_per_hour_input: employee.cost_per_hour ? employee.cost_per_hour.toFixed(2) : "0.00"
    } : {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      phone: '',
      specialization: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
      certifications: [],
      cost_per_hour: 0,
      cost_per_hour_input: "0.00"
    }
  );

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Special handling for cost_per_hour to ensure it's a number
    if (name === 'cost_per_hour') {
      const numValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create a clean copy of the employee data without the temporary fields
      const cleanFormData: Employee = {
        id: formData.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialization: formData.specialization,
        hire_date: formData.hire_date,
        status: formData.status as 'active' | 'inactive',
        certifications: formData.certifications || [],
        cost_per_hour: typeof formData.cost_per_hour === 'string'
          ? parseFloat(formData.cost_per_hour)
          : (formData.cost_per_hour || 0)
      };

      if (!employee) {
        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: password,
          options: {
            data: {
              full_name: formData.name
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user account');

        // Add auth_id to employee data
        cleanFormData.auth_id = authData.user.id;
      }

      console.log('Saving employee with clean data:', cleanFormData);
      onSave(cleanFormData);
      onClose();
    } catch (err) {
      console.error('Error saving employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              required
              disabled={!!employee}
            />
          </div>

          {!employee && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50 pr-24"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-dark-400 hover:text-dark-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Hire Date
            </label>
            <input
              type="date"
              name="hire_date"
              value={formData.hire_date}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Cost per Hour
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
                $
              </span>
              <input
                type="text"
                name="cost_per_hour"
                value={formData.cost_per_hour_input || formData.cost_per_hour?.toString() || "0.00"}
                onChange={(e) => {
                  // Store the raw input
                  const inputValue = e.target.value;

                  // Remove non-numeric and non-decimal characters except for the first decimal point
                  const cleanedInput = inputValue.replace(/[^\d.]/g, '')
                    .replace(/(\..*)\./g, '$1'); // Allow only one decimal point

                  // Update both the display value and the numeric value
                  setFormData(prev => ({
                    ...prev,
                    cost_per_hour_input: cleanedInput,
                    cost_per_hour: cleanedInput === '' ? 0 : parseFloat(cleanedInput) || 0
                  }));
                }}
                onBlur={(e) => {
                  // Format the value to 2 decimal places when leaving the field
                  const value = parseFloat(formData.cost_per_hour_input || '0');
                  const formatted = isNaN(value) ? "0.00" : value.toFixed(2);

                  setFormData(prev => ({
                    ...prev,
                    cost_per_hour_input: formatted,
                    cost_per_hour: isNaN(value) ? 0 : value
                  }));
                }}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-3 py-2 text-dark-50"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-dark-400">
              Hourly cost rate for the employee
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : employee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  employee: Employee;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ employee, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 border border-dark-700">
      <h2 className="text-xl font-semibold text-dark-50 mb-4">Delete Employee</h2>
      <p className="text-dark-200 mb-6">
        Are you sure you want to delete {employee.name}? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-dark-50 rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const EmployeeProfile: React.FC<{ employee: Employee }> = ({ employee }) => {
  const [tasks, setTasks] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const jobs = await getMaintenanceJobs();
        setTasks(jobs.filter(job => job.employee_id === employee.id));
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [employee.id]);

  return (
    <div className="bg-dark-800 rounded-lg shadow border border-dark-700 overflow-hidden">
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-dark-300" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-dark-50">{employee.name}</h3>
            <p className="text-dark-300">{employee.specialization}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                employee.status === 'active'
                  ? 'bg-green-900/50 text-green-100'
                  : 'bg-red-900/50 text-red-100'
              }`}>
                {employee.status}
              </span>
              <span className="text-dark-400">•</span>
              <span className="text-sm text-dark-300">
                Hired {new Date(employee.hire_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Mail className="text-dark-400" size={16} />
            <span className="text-dark-200">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="text-dark-400" size={16} />
            <span className="text-dark-200">{employee.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="text-dark-400" size={16} />
            <span className="text-dark-200 font-mono">${(employee.cost_per_hour || 0).toFixed(2)}/hour</span>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-dark-700">
        <h4 className="text-sm font-medium text-dark-100 mb-3 flex items-center gap-2">
          <Award className="text-dark-400" size={16} />
          Certifications
        </h4>
        <div className="flex flex-wrap gap-2">
          {employee.certifications.map((cert, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-dark-700 rounded text-xs font-medium text-dark-100"
            >
              {cert}
            </span>
          ))}
        </div>
      </div>

      <div className="p-6">
        <h4 className="text-sm font-medium text-dark-100 mb-3 flex items-center gap-2">
          <Calendar className="text-dark-400" size={16} />
          Current Tasks
        </h4>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map(n => (
              <div key={n} className="h-12 bg-dark-700 rounded"></div>
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="p-3 bg-dark-700 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-dark-100">{task.title}</h5>
                    <p className="text-sm text-dark-300">
                      {task.vehicle.make} {task.vehicle.model} ({task.vehicle.registration})
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'done' ? 'bg-green-900/50 text-green-100' :
                    task.status === 'qa' ? 'bg-purple-900/50 text-purple-100' :
                    task.status === 'in-progress' ? 'bg-yellow-900/50 text-yellow-100' :
                    'bg-blue-900/50 text-blue-100'
                  }`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-dark-300">No active tasks</p>
        )}
      </div>
    </div>
  );
};

// Crew Modal Component
interface CrewModalProps {
  crew?: Crew;
  onClose: () => void;
  onSave: (crew: Crew) => void;
}

const CrewModal: React.FC<CrewModalProps> = ({ crew, onClose, onSave }) => {
  const [formData, setFormData] = useState<Crew>( 
    crew ? { ...crew } : {
      id: crypto.randomUUID(),
      name: '',
      description: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create clean crew data
      const cleanFormData: Crew = {
        id: formData.id,
        name: formData.name,
        description: formData.description
      };
      
      onSave(cleanFormData);
    } catch (err) {
      console.error('Error saving crew:', err);
      setError(err instanceof Error ? err.message : 'Failed to save crew');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">
            {crew ? 'Edit Crew' : 'Create New Crew'}
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Crew Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50 min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : crew ? 'Save Changes' : 'Create Crew'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Crew Member Modal
interface AddCrewMemberModalProps {
  crew: Crew;
  availableEmployees: Employee[];
  onClose: () => void;
  onAdd: (employeeId: string, isLeader: boolean) => void;
}

const AddCrewMemberModal: React.FC<AddCrewMemberModalProps> = ({ crew, availableEmployees, onClose, onAdd }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = availableEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    
    setLoading(true);
    onAdd(selectedEmployeeId, isLeader);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">
            Add Member to {crew.name}
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto border border-dark-700 rounded-lg">
              {filteredEmployees.length > 0 ? (
                <div className="divide-y divide-dark-700">
                  {filteredEmployees.map(employee => (
                    <label 
                      key={employee.id}
                      className={`flex items-center p-3 hover:bg-dark-750 cursor-pointer ${
                        selectedEmployeeId === employee.id ? 'bg-dark-700' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="employee"
                        value={employee.id}
                        checked={selectedEmployeeId === employee.id}
                        onChange={() => setSelectedEmployeeId(employee.id)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-dark-50">{employee.name}</div>
                        <div className="text-sm text-dark-300">{employee.specialization}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-dark-300">
                  No available employees found
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-dark-200">
              <input
                type="checkbox"
                checked={isLeader}
                onChange={(e) => setIsLeader(e.target.checked)}
                className="rounded border-dark-600 bg-dark-700 text-blue-600"
              />
              <span>Assign as crew leader</span>
            </label>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={!selectedEmployeeId || loading}
              >
                {loading ? 'Adding...' : 'Add to Crew'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Crew Confirmation Modal
interface DeleteCrewModalProps {
  crew: Crew;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteCrewModal: React.FC<DeleteCrewModalProps> = ({ crew, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 border border-dark-700">
      <h2 className="text-xl font-semibold text-dark-50 mb-4">Delete Crew</h2>
      <p className="text-dark-200 mb-6">
        Are you sure you want to delete the crew "{crew.name}"? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-dark-50 rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// Main OrganizationPage Component
const OrganizationPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'employees' | 'crews'>('employees');
  
  // Employee state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  
  // Crew state
  const [crews, setCrews] = useState<Crew[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [selectedCrewWithMembers, setSelectedCrewWithMembers] = useState<CrewWithMembers | null>(null);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [crewToDelete, setCrewToDelete] = useState<Crew | null>(null);
  
  // Shared state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      const employeesData = await getEmployees();
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
      setEmployees([]);
      setLoading(false);
    }
  };

  // Fetch all crews
  const fetchCrews = async () => {
    try {
      const crewsData = await getCrews();
      setCrews(crewsData);
    } catch (err) {
      console.error('Error fetching crews:', err);
      setError('Failed to load crews');
      setCrews([]);
    }
  };

  // Fetch a single crew with its members
  const fetchCrewWithMembers = async (crewId: string) => {
    try {
      const crewData = await getCrewWithMembers(crewId);
      if (crewData) {
        setSelectedCrewWithMembers(crewData);
      } else {
        setError(`Crew with ID ${crewId} not found`);
      }
    } catch (err) {
      console.error('Error fetching crew with members:', err);
      setError('Failed to load crew details');
      setSelectedCrewWithMembers(null);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      await fetchEmployees();
      await fetchCrews();
    };
    
    loadData();
  }, []);
  
  // When a crew is selected, fetch its members
  useEffect(() => {
    if (selectedCrew) {
      fetchCrewWithMembers(selectedCrew.id);
    } else {
      setSelectedCrewWithMembers(null);
    }
  }, [selectedCrew]);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter crews based on search term
  const filteredCrews = crews.filter(crew =>
    crew.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (crew.description && crew.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // For crew member management - get available employees not in this crew
  const getAvailableEmployees = (): Employee[] => {
    if (!selectedCrewWithMembers) return employees;
    
    const memberIds = selectedCrewWithMembers.members.map(member => member.employee_id);
    return employees.filter(employee => !memberIds.includes(employee.id));
  };
  
  // EMPLOYEE HANDLERS
  const handleSaveEmployee = async (employee: Employee) => {
    try {
      setLoading(true);
      setError(null);

      if (selectedEmployee) {
        // Update existing employee
        const updated = await updateEmployee(employee.id, employee);
        if (updated) {
          await fetchEmployees();
          setShowEmployeeModal(false);
        } else {
          console.error('Update returned null');
          setError('Failed to update employee');
        }
      } else {
        // Add new employee
        const created = await addEmployee(employee);
        if (created) {
          await fetchEmployees();
          setShowEmployeeModal(false);
        } else {
          console.error('Create returned null');
          setError('Failed to create employee');
        }
      }
    } catch (err) {
      console.error('Error saving employee:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    try {
      const deleted = await deleteEmployee(employee.id);
      if (deleted) {
        await fetchEmployees();
        setEmployeeToDelete(null);
      } else {
        setError(`Unable to delete employee "${employee.name}"`);
        setEmployeeToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
      setEmployeeToDelete(null);
    }
  };

  const toggleEmployeeStatus = async (employeeId: string) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      const newStatus = employee.status === 'active' ? 'inactive' : 'active';
      const updated = await updateEmployee(employeeId, { ...employee, status: newStatus });
      
      if (updated) {
        await fetchEmployees();
      } else {
        setError('Failed to update employee status');
      }
    } catch (err) {
      console.error('Error updating employee status:', err);
      setError('Failed to update employee status');
    }
  };
  
  // CREW HANDLERS
  const handleSaveCrew = async (crew: Crew) => {
    try {
      setLoading(true);
      setError(null);

      if (selectedCrew) {
        // Update existing crew
        const updated = await updateCrew(crew.id, crew);
        if (updated) {
          await fetchCrews();
          setShowCrewModal(false);
        } else {
          setError('Failed to update crew');
        }
      } else {
        // Add new crew
        const created = await addCrew(crew);
        if (created) {
          await fetchCrews();
          setShowCrewModal(false);
        } else {
          setError('Failed to create crew');
        }
      }
    } catch (err) {
      console.error('Error saving crew:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving crew');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrew = async (crew: Crew) => {
    try {
      const deleted = await deleteCrew(crew.id);
      if (deleted) {
        await fetchCrews();
        setCrewToDelete(null);
        setSelectedCrew(null);
      } else {
        setError(`Unable to delete crew "${crew.name}"`);
        setCrewToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting crew:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete crew');
      setCrewToDelete(null);
    }
  };
  
  const handleAddCrewMember = async (employeeId: string, isLeader: boolean) => {
    if (!selectedCrew) return;
    
    try {
      setError(null);
      const member = await addCrewMember(selectedCrew.id, employeeId, isLeader);
      
      if (member) {
        await fetchCrewWithMembers(selectedCrew.id);
        await fetchCrews();
        setShowAddMemberModal(false);
      } else {
        setError('Failed to add member to crew');
      }
    } catch (err) {
      console.error('Error adding crew member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add member to crew');
    }
  };
  
  const handleRemoveCrewMember = async (memberId: string) => {
    if (!selectedCrew || !selectedCrewWithMembers) return;
    
    try {
      const member = selectedCrewWithMembers.members.find(m => m.employee_id === memberId);
      if (!member) return;
      
      const removed = await removeCrewMember(selectedCrew.id, memberId);
      
      if (removed) {
        await fetchCrewWithMembers(selectedCrew.id);
        await fetchCrews();
      } else {
        setError('Failed to remove member from crew');
      }
    } catch (err) {
      console.error('Error removing crew member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member from crew');
    }
  };
  
  const handleToggleLeader = async (memberId: string, isLeader: boolean) => {
    if (!selectedCrew) return;
    
    try {
      const updated = await updateCrewMemberRole(selectedCrew.id, memberId, isLeader);
      
      if (updated) {
        await fetchCrewWithMembers(selectedCrew.id);
      } else {
        setError('Failed to update member role');
      }
    } catch (err) {
      console.error('Error updating crew member role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  if (loading && crews.length === 0 && employees.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 bg-dark-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl text-dark-50">Organization</h1>
        
        <div className="flex space-x-3">
          {activeTab === 'employees' && (
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setShowEmployeeModal(true);
              }}
              className="bg-blue-600 text-dark-50 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Employee</span>
            </button>
          )}
          
          {activeTab === 'crews' && !selectedCrew && (
            <button
              onClick={() => {
                setSelectedCrew(null);
                setShowCrewModal(true);
              }}
              className="bg-blue-600 text-dark-50 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Create Crew</span>
            </button>
          )}
          
          {activeTab === 'crews' && selectedCrew && (
            <>
              <button
                onClick={() => {
                  setShowAddMemberModal(true);
                }}
                className="bg-blue-600 text-dark-50 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={18} />
                <span>Add Member</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedCrew(null);
                }}
                className="bg-dark-700 text-dark-200 border border-dark-600 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-dark-600 transition-colors"
              >
                <span>Back to Crews</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 flex border-b border-dark-700">
        <button
          onClick={() => setActiveTab('employees')}
          className={`py-2 px-6 text-sm font-medium focus:outline-none ${
            activeTab === 'employees'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-dark-300 hover:text-dark-100'
          }`}
        >
          All Employees
        </button>
        <button
          onClick={() => {
            setActiveTab('crews');
            setSelectedCrew(null);
          }}
          className={`py-2 px-6 text-sm font-medium focus:outline-none ${
            activeTab === 'crews'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-dark-300 hover:text-dark-100'
          }`}
        >
          Crews
        </button>
      </div>
      
      {/* Search bar */}
      <div className="bg-dark-800 rounded-lg shadow border border-dark-700 mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'employees' ? 'employees' : 'crews'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50"
            />
          </div>
        </div>
      </div>
      
      {/* Employees Tab Content */}
      {activeTab === 'employees' && (
        <div className="bg-dark-800 rounded-lg shadow border border-dark-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Hire Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Cost/Hour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-800 divide-y divide-dark-700">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-dark-50">{employee.name}</div>
                      <div className="text-sm text-dark-300">
                        {employee.certifications.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-100">{employee.email}</div>
                      <div className="text-sm text-dark-300">{employee.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-100">
                        {employee.specialization}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-100">
                        {new Date(employee.hire_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-100 font-mono">
                        ${(employee.cost_per_hour || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === 'active'
                          ? 'bg-green-900/50 text-green-100'
                          : 'bg-red-900/50 text-red-100'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEmployeeModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => toggleEmployeeStatus(employee.id)}
                          className={`${
                            employee.status === 'active'
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-green-400 hover:text-green-300'
                          }`}
                          title={employee.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {employee.status === 'active' ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => setEmployeeToDelete(employee)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Crews Tab Content - List View */}
      {activeTab === 'crews' && !selectedCrew && (
        <div className="bg-dark-800 rounded-lg shadow border border-dark-700">
          {filteredCrews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Crew Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-dark-800 divide-y divide-dark-700">
                  {filteredCrews.map((crew) => (
                    <tr key={crew.id} className="hover:bg-dark-750 cursor-pointer" onClick={() => setSelectedCrew(crew)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-dark-50 flex items-center">
                          <Group size={18} className="text-dark-400 mr-2" />
                          {crew.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-dark-200 line-clamp-2">
                          {crew.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-100">
                          {crew.member_count || 0} member{(crew.member_count !== 1) ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCrew(crew);
                              setShowCrewModal(true);
                            }}
                            className="text-blue-400 hover:text-blue-300"
                            title="Edit Crew"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCrewToDelete(crew);
                            }}
                            className="text-red-400 hover:text-red-300"
                            title="Delete Crew"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCrew(crew);
                            }}
                            className="text-blue-400 hover:text-blue-300 ml-2"
                            title="View Details"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Group size={48} className="mx-auto mb-4 text-dark-600" />
              <h3 className="text-lg font-medium text-dark-200 mb-2">No Crews Found</h3>
              <p className="text-dark-400 mb-6">
                Create your first crew to organize employees into teams.
              </p>
              <button
                onClick={() => {
                  setSelectedCrew(null);
                  setShowCrewModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus size={18} />
                <span>Create Crew</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Crews Tab Content - Detail View */}
      {activeTab === 'crews' && selectedCrew && selectedCrewWithMembers && (
        <div className="bg-dark-800 rounded-lg shadow border border-dark-700">
          <div className="p-6 border-b border-dark-700">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-medium text-dark-50 mb-2 flex items-center">
                  <Group size={20} className="text-dark-400 mr-2" />
                  {selectedCrewWithMembers.name}
                </h2>
                <p className="text-dark-300">
                  {selectedCrewWithMembers.description || 'No description'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCrew(selectedCrewWithMembers);
                    setShowCrewModal(true);
                  }}
                  className="text-sm px-3 py-1 border border-dark-600 rounded hover:bg-dark-700 flex items-center gap-1"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setCrewToDelete(selectedCrewWithMembers)}
                  className="text-sm px-3 py-1 border border-red-800 text-red-400 rounded hover:bg-red-900/30 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium text-dark-100 mb-4">Crew Members</h3>
            
            {selectedCrewWithMembers.members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedCrewWithMembers.members.map((member) => (
                  <div 
                    key={member.employee_id} 
                    className="bg-dark-750 rounded-lg p-4 border border-dark-700 flex justify-between"
                  >
                    <div>
                      <div className="flex items-center mb-2">
                        <User size={18} className="text-dark-400 mr-2" />
                        <span className="font-medium text-dark-50">
                          {member.employee?.name}
                        </span>
                        {member.is_leader && (
                          <span className="ml-2 bg-amber-900/50 text-amber-200 rounded-full px-2 py-0.5 text-xs flex items-center">
                            <Star size={12} className="mr-1" />
                            Leader
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-dark-300">
                        {member.employee?.specialization}
                      </p>
                      {member.employee?.cost_per_hour !== undefined && (
                        <p className="text-xs text-dark-400 mt-1">
                          <DollarSign size={12} className="inline mr-1" />
                          {member.employee.cost_per_hour.toFixed(2)}/hour
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {!member.is_leader ? (
                        <button
                          onClick={() => handleToggleLeader(member.employee_id, true)}
                          className="text-amber-400 hover:text-amber-300"
                          title="Make Leader"
                        >
                          <Star size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleLeader(member.employee_id, false)}
                          className="text-amber-400 hover:text-amber-300"
                          title="Remove Leader Status"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveCrewMember(member.employee_id)}
                        className="text-red-400 hover:text-red-300"
                        title="Remove from Crew"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-750 rounded-lg p-8 text-center border border-dark-700">
                <Users size={36} className="mx-auto mb-4 text-dark-600" />
                <h3 className="text-lg font-medium text-dark-200 mb-2">No Members</h3>
                <p className="text-dark-400 mb-6">
                  Add employees to this crew to start organizing your team.
                </p>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  <span>Add Member</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modals */}
      {showEmployeeModal && (
        <EmployeeModal
          employee={selectedEmployee || undefined}
          onClose={() => setShowEmployeeModal(false)}
          onSave={handleSaveEmployee}
        />
      )}
      
      {employeeToDelete && (
        <DeleteConfirmModal
          employee={employeeToDelete}
          onClose={() => setEmployeeToDelete(null)}
          onConfirm={() => handleDeleteEmployee(employeeToDelete)}
        />
      )}
      
      {showCrewModal && (
        <CrewModal
          crew={selectedCrew || undefined}
          onClose={() => setShowCrewModal(false)}
          onSave={handleSaveCrew}
        />
      )}
      
      {crewToDelete && (
        <DeleteCrewModal
          crew={crewToDelete}
          onClose={() => setCrewToDelete(null)}
          onConfirm={() => handleDeleteCrew(crewToDelete)}
        />
      )}
      
      {showAddMemberModal && selectedCrew && (
        <AddCrewMemberModal
          crew={selectedCrew}
          availableEmployees={getAvailableEmployees()}
          onClose={() => setShowAddMemberModal(false)}
          onAdd={handleAddCrewMember}
        />
      )}
    </div>
  );
};

export default OrganizationPage;