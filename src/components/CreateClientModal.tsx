import React, { useState } from 'react';
import { X, Plus, Car } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Vehicle {
  registration: string;
  make: string;
  model: string;
  year: string;
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

interface CreateClientModalProps {
  onClose: () => void;
  onCreateClient: (client: Client) => void;
  client?: Client | null;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({ onClose, onCreateClient, client }) => {
  const [formData, setFormData] = useState<Client>({
    first_name: '',
    last_name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    vehicles: []
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVehicleChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle, i) => 
        i === index ? { ...vehicle, [field]: value } : vehicle
      )
    }));
  };

  const addVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, { registration: '', make: '', model: '', year: '' }]
    }));
  };

  const removeVehicle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (client?.id) {
        // Update existing client
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code
          })
          .eq('id', client.id);

        if (clientError) throw new Error('Failed to update client: ' + clientError.message);

        // Delete existing vehicles
        const { error: deleteError } = await supabase
          .from('vehicles')
          .delete()
          .eq('client_id', client.id);

        if (deleteError) throw new Error('Failed to update vehicles: ' + deleteError.message);

        // Add new vehicles
        if (formData.vehicles.length > 0) {
          const { error: vehiclesError } = await supabase
            .from('vehicles')
            .insert(
              formData.vehicles.map(vehicle => ({
                registration: vehicle.registration,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                client_id: client.id
              }))
            );

          if (vehiclesError) throw new Error('Failed to add vehicles: ' + vehiclesError.message);
        }
      } else {
        // Create new client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code
          })
          .select()
          .single();

        if (clientError) throw new Error('Failed to create client: ' + clientError.message);
        if (!clientData) throw new Error('No client data returned after creation');

        // Add their vehicles
        if (formData.vehicles.length > 0) {
          const { error: vehiclesError } = await supabase
            .from('vehicles')
            .insert(
              formData.vehicles.map(vehicle => ({
                registration: vehicle.registration,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                client_id: clientData.id
              }))
            );

          if (vehiclesError) throw new Error('Failed to add vehicles: ' + vehiclesError.message);
        }
      }

      onCreateClient(formData);
      onClose();
    } catch (err) {
      console.error('Error creating client:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-dark-50">
              {client ? 'Edit Client' : 'Create New Client'}
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm font-medium">{client ? 'Edit Client' : 'New Client'}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
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
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Address</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-dark-100">Vehicles</h3>
              <button
                type="button"
                onClick={addVehicle}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus size={16} />
                Add Vehicle
              </button>
            </div>
            {formData.vehicles.map((vehicle, index) => (
              <div key={index} className="p-4 bg-dark-700 rounded-lg space-y-4 border border-dark-600">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-dark-100">Vehicle {index + 1}</h4>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Make
                    </label>
                    <input
                      type="text"
                      value={vehicle.make}
                      onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                      className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-dark-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={vehicle.model}
                      onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                      className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-dark-50"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Year
                    </label>
                    <input
                      type="text"
                      value={vehicle.year}
                      onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                      className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-dark-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Registration/License
                    </label>
                    <input
                      type="text"
                      value={vehicle.registration}
                      onChange={(e) => handleVehicleChange(index, 'registration', e.target.value)}
                      className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-dark-50"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
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
              {loading ? 'Saving...' : client ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClientModal;