export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  hireDate: string;
  status: 'active' | 'inactive';
  certifications: string[];
}

// Mock data for employees
export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@airmaintenance.com',
    phone: '(555) 123-4567',
    specialization: 'Engine Specialist',
    hireDate: '2022-03-15',
    status: 'active',
    certifications: ['A&P License', 'Boeing 737 Type Rating']
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@airmaintenance.com',
    phone: '(555) 234-5678',
    specialization: 'Avionics Expert',
    hireDate: '2021-06-01',
    status: 'active',
    certifications: ['Avionics Certification', 'FAA Inspection Authorization']
  },
  {
    id: '3',
    name: 'Mike Williams',
    email: 'm.williams@airmaintenance.com',
    phone: '(555) 345-6789',
    specialization: 'General Maintenance',
    hireDate: '2023-01-10',
    status: 'active',
    certifications: ['A&P License']
  }
];