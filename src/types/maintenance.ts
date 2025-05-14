export interface MaintenanceJob {
  id: string;
  title: string;
  description: string;
  aircraft: {
    registration: string;
    model: string;
  };
  assignee: {
    id: number;
    name: string;
    specialization: string;
  };
  client: {
    id: number;
    name: string;
    company: string;
  };
  startTime: string; // ISO date string
  duration: number; // in hours
  status: 'not-started' | 'in-progress' | 'qa' | 'done';
}

// Mock data
export const MOCK_MAINTENANCE_JOBS: MaintenanceJob[] = [
  {
    id: '1',
    title: 'Engine Inspection',
    description: 'Complete engine inspection for routine maintenance',
    aircraft: {
      registration: 'N12345',
      model: 'Boeing 737-800'
    },
    assignee: {
      id: 1,
      name: 'John Smith',
      specialization: 'Engine Specialist'
    },
    client: {
      id: 1,
      name: 'Air Express',
      company: 'Air Express Ltd'
    },
    startTime: '2024-03-20T09:00:00Z',
    duration: 2,
    status: 'not-started'
  },
  {
    id: '2',
    title: 'Avionics Update',
    description: 'Install latest avionics software update',
    aircraft: {
      registration: 'N67890',
      model: 'Airbus A320'
    },
    assignee: {
      id: 2,
      name: 'Sarah Johnson',
      specialization: 'Avionics Expert'
    },
    client: {
      id: 2,
      name: 'Sky Charter',
      company: 'Sky Charter Services'
    },
    startTime: '2024-03-21T14:00:00Z',
    duration: 4,
    status: 'in-progress'
  },
  {
    id: '3',
    title: 'Landing Gear Service',
    description: 'Routine landing gear maintenance and inspection',
    aircraft: {
      registration: 'N11223',
      model: 'Embraer E190'
    },
    assignee: {
      id: 3,
      name: 'Mike Williams',
      specialization: 'General Maintenance'
    },
    client: {
      id: 3,
      name: 'Global Airways',
      company: 'Global Airways Inc'
    },
    startTime: '2024-03-19T11:00:00Z',
    duration: 3,
    status: 'done'
  }
];