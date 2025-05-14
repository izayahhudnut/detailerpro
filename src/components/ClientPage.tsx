import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Plane, Calendar, Plus, Trash2, Edit2, X } from 'lucide-react';
import { getMaintenanceJobs, getClients, deleteClient } from '../lib/data';
import type { MaintenanceJob } from '../lib/data';
import CreateClientModal from './CreateClientModal';

// Define the Client interface to match CreateClientModal's expectations
interface Vehicle {
  registration: string;
  make: string;
  model: string;
  year: string;
  id?: string;
}

interface Client {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  vehicles: Vehicle[];
}

interface DeleteConfirmModalProps {
  client: Client;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ client, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 border border-dark-700">
      <h2 className="text-xl font-semibold text-dark-50 mb-4">Delete Client</h2>
      <p className="text-dark-200 mb-6">
        Are you sure you want to delete {client.first_name} {client.last_name}? This action cannot be undone and will also delete all associated records.
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

const ClientCard: React.FC<{ client: Client; onClick: () => void }> = ({ client, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-dark-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border border-dark-700"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center">
        <User className="text-blue-400" size={24} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-dark-50">{client.first_name} {client.last_name}</h3>
        <p className="text-dark-200">{client.email}</p>
      </div>
    </div>
    <div className="text-sm text-dark-300">
      <p>{client.city}, {client.state}</p>
      <p className="mt-2">{client.vehicles?.length || 0} Vehicle registered</p>
    </div>
  </div>
);

const ClientDetails: React.FC<{ 
  client: Client; 
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  tasks: MaintenanceJob[];
}> = ({ client, onClose, onDelete, onEdit, tasks }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'files'>('jobs');
  // Document upload & list
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fetchDocuments = async () => {
    try {
      const { data: files } = await supabase
        .storage.from('client-documents')
        .list(client.id);
      if (files) {
        const docs = files.map(f => {
          // generate public URL for file
          const { data } = supabase
            .storage.from('client-documents')
            .getPublicUrl(`${client.id}/${f.name}`);
          // supabase may return publicUrl or publicURL depending on version
          const url = (data as any).publicUrl || (data as any).publicURL || '';
          return { name: f.name, url };
        });
        setDocuments(docs);
      }
    } catch (err) {
      console.error('Error listing documents:', err);
    }
  };
  useEffect(() => {
    fetchDocuments();
  }, [client.id]);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // sanitize file name to avoid invalid paths
      const safeName = file.name.replace(/\s+/g, '_');
      const { error } = await supabase
        .storage.from('client-documents')
        .upload(`${client.id}/${safeName}`, file, { upsert: true });
      if (error) {
        console.error('Error uploading document:', error.message);
      } else {
        fetchDocuments();
      }
    } catch (err: any) {
      console.error('Unexpected error uploading document:', err.message || err);
    }
  };
  return (
    <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700">
      <div className="p-6 border-b border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-dark-50">
            {client.first_name} {client.last_name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg hover:bg-dark-700"
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-dark-700"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={onClose}
              className="text-dark-400 hover:text-dark-200 px-4 py-2 rounded-lg hover:bg-dark-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-dark-100 mb-4">Contact Information</h3>
          <div className="space-y-2 text-dark-200">
            <p>Email: {client.email}</p>
            <p>Address: {client.street}</p>
            <p>{client.city}, {client.state} {client.zip_code}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-dark-100 mb-4">Fleet</h3>
          <div className="space-y-3">
            {client.vehicles?.map((vehicle: Vehicle) => (
              <div 
                key={vehicle.id}
                className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg"
              >
                <Plane className="text-blue-400" size={20} />
                <div>
                  <p className="font-medium text-dark-100">{vehicle.make} {vehicle.model}</p>
                  <p className="text-sm text-dark-300">{vehicle.registration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div
      className="p-6"
    >
      {/* Tabs */}
      <div className="border-b border-dark-600 mb-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`pb-2 ${activeTab === 'jobs' ? 'border-b-2 border-blue-500 text-dark-50' : 'text-dark-300 hover:text-dark-100'}`}
          >Jobs</button>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-2 ${activeTab === 'files' ? 'border-b-2 border-blue-500 text-dark-50' : 'text-dark-300 hover:text-dark-100'}`}
          >Files</button>
        </nav>
      </div>
      {activeTab === 'jobs' ? (
        <section>
          <h3 className="text-lg font-medium text-dark-100 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Maintenance Tasks
          </h3>
          <div className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <div 
                  key={task.id}
                  className="p-4 border border-dark-700 rounded-lg hover:shadow-sm transition-shadow bg-dark-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-dark-100">{task.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'done' ? 'bg-green-900/50 text-green-100' :
                      task.status === 'qa' ? 'bg-purple-900/50 text-purple-100' :
                      task.status === 'in-progress' ? 'bg-yellow-900/50 text-yellow-100' :
                      'bg-blue-900/50 text-blue-100'
                    }`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-dark-200 mb-2">{task.description}</p>
                  <div className="text-sm text-dark-300">
                    <p>Vehicle: {task.vehicle.model} ({task.vehicle.registration})</p>
                    <p>Scheduled: {new Date(task.start_time).toLocaleDateString()}</p>
                    <p>Duration: {task.duration}h</p>
                    <p>Assigned to: {task.employee ? `${task.employee.name} (${task.employee.specialization})` :
                      task.crew ? `Crew: ${task.crew.name}` : 'Unassigned'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-dark-300">No maintenance tasks found</p>
            )}
          </div>
        </section>
      ) : (
        <section>
          <h3 className="text-lg font-medium text-dark-100 mb-4">Files</h3>
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700"
        >
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
          <ul className="text-sm text-dark-200 list-disc list-inside space-y-1">
            {documents.map((doc, idx) => (
              <li key={idx}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                  {doc.name}
                </a>
                <a href={doc.url} download className="ml-2 text-blue-400 hover:underline">
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  </div>
  );
};

const ClientPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<MaintenanceJob[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const clientsData = await getClients();
      
      // Convert data.ts clients to our local Client type, ensuring vehicles property is always an array
      const formattedClients: Client[] = clientsData.map(client => ({
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        street: client.street,
        city: client.city,
        state: client.state,
        zip_code: client.zip_code,
        vehicles: (client.vehicles || []).map(v => ({
          id: v.id,
          registration: v.registration,
          make: v.make,
          model: v.model,
          year: v.year
        }))
      }));
      
      setClients(formattedClients);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (selectedClient) {
        try {
          const maintenanceJobs = await getMaintenanceJobs();
      const filteredJobs = maintenanceJobs.filter(
        job => job.vehicle.client.id === selectedClient.id
      );
          setTasks(filteredJobs);
        } catch (err) {
          console.error('Error fetching maintenance jobs:', err);
          setTasks([]);
        }
      }
    };

    fetchTasks();
  }, [selectedClient]);

  // Handle create/edit client (non-async to satisfy onCreateClient prop)
  const handleCreateClient = (_: Client) => {
    // Client has been created or updated in the modal component
    // Just refresh the client list
    fetchClients().finally(() => {
      setIsCreateModalOpen(false);
    });
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsCreateModalOpen(true);
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      // Ensure client.id is defined before deleting
      if (!client.id) {
        throw new Error('Client ID is undefined');
      }
      
      const deleted = await deleteClient(client.id);
      if (deleted) {
        setSelectedClient(null);
        setDeleteConfirmClient(null);
        await fetchClients(); // Refresh the client list
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client and associated records');
    }
  };

  if (loading) {
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
    <div className="p-6">
      {/* Page header only for client list view */}
      {!selectedClient && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-dark-50">Clients</h1>
          <button
            onClick={() => {
              setEditingClient(null);
              setIsCreateModalOpen(true);
            }}
            className="bg-blue-600 text-dark-50 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Client</span>
          </button>
        </div>
      )}
      
      {selectedClient ? (
        <ClientDetails 
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onDelete={() => setDeleteConfirmClient(selectedClient)}
          onEdit={() => handleEditClient(selectedClient)}
          tasks={tasks}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(clients) && clients.length > 0 ? (
            clients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => setSelectedClient(client)}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-dark-300">
              No clients found. Click "Add Client" to create one.
            </div>
          )}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateClientModal
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingClient(null);
          }}
          onCreateClient={handleCreateClient}
          client={editingClient}
        />
      )}

      {deleteConfirmClient && (
        <DeleteConfirmModal
          client={deleteConfirmClient}
          onClose={() => setDeleteConfirmClient(null)}
          onConfirm={() => handleDeleteClient(deleteConfirmClient)}
        />
      )}
    </div>
  );
};

export default ClientPage;