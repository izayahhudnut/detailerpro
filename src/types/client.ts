export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  aircraft: {
    registration: string;
    model: string;
  }[];
}

// Mock data for clients
export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@airexpress.com',
    address: {
      street: '123 Aviation Way',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90045'
    },
    aircraft: [
      {
        registration: 'N12345',
        model: 'Boeing 737-800'
      },
      {
        registration: 'N12346',
        model: 'Airbus A320'
      }
    ]
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@skycharter.com',
    address: {
      street: '456 Airport Road',
      city: 'Miami',
      state: 'FL',
      zipCode: '33142'
    },
    aircraft: [
      {
        registration: 'N67890',
        model: 'Airbus A320'
      }
    ]
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Williams',
    email: 'm.williams@globalairways.com',
    address: {
      street: '789 Terminal Drive',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75261'
    },
    aircraft: [
      {
        registration: 'N11223',
        model: 'Embraer E190'
      }
    ]
  }
];