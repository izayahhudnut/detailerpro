import React, { useState, useEffect } from 'react';
import { Package, PenTool as Tool, Plane, AlertTriangle, Plus, Search, RefreshCw, ArrowUp, ArrowDown, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InventoryItem {
  id: string;
  name: string;
  type: 'tool' | 'product';
  description: string;
  quantity: number;
  minimum_stock: number;
  unit: string;
  location: string;
  last_restocked: string;
}

interface AircraftStatus {
  id: string;
  aircraft_id: string;
  aircraft: {
    registration: string;
    model: string;
    client: {
      first_name: string;
      last_name: string;
    };
  };
  flight_status: 'grounded' | 'maintenance' | 'scheduled' | 'in-flight' | 'landed';
  current_location: string;
  flight_hours: number;
  last_maintenance: string;
  next_maintenance_due: string;
  maintenance_notes: string;
}

const InventoryList: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tool' | 'product'>('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getLowStockItems = () => {
    return filteredInventory.filter(item => item.quantity <= item.minimum_stock);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Inventory Management</h2>
        <button className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          Add Item
        </button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'tool' | 'product')}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Items</option>
            <option value="tool">Tools</option>
            <option value="product">Products</option>
          </select>
        </div>

        {getLowStockItems().length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertTriangle size={20} />
              <h3 className="font-medium">Low Stock Alert</h3>
            </div>
            <div className="space-y-2">
              {getLowStockItems().map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <span className="text-yellow-800">
                    {item.quantity} {item.unit} remaining
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredInventory.map(item => (
          <div
            key={item.id}
            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {item.type === 'tool' ? (
                  <Tool className="text-blue-600" size={24} />
                ) : (
                  <Package className="text-green-600" size={24} />
                )}
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${
                  item.quantity <= item.minimum_stock ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {item.quantity} {item.unit}
                </div>
                <div className="text-sm text-gray-500">
                  Min: {item.minimum_stock} {item.unit}
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPin size={16} />
                {item.location}
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw size={16} />
                Last restocked: {new Date(item.last_restocked).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AircraftTracker: React.FC = () => {
  const [aircraft, setAircraft] = useState<AircraftStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAircraftStatus();
  }, []);

  const fetchAircraftStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft_tracking')
        .select(`
          *,
          aircraft (
            registration,
            model,
            client:clients (
              first_name,
              last_name
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAircraft(data || []);
    } catch (err) {
      console.error('Error fetching aircraft status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AircraftStatus['flight_status']) => {
    switch (status) {
      case 'in-flight':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'grounded':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'landed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceStatus = (aircraft: AircraftStatus) => {
    const nextMaintenance = new Date(aircraft.next_maintenance_due);
    const now = new Date();
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilMaintenance <= 0) {
      return {
        color: 'text-red-600',
        icon: <ArrowUp className="text-red-600" size={16} />,
        text: 'Maintenance Overdue'
      };
    } else if (daysUntilMaintenance <= 7) {
      return {
        color: 'text-yellow-600',
        icon: <Clock className="text-yellow-600" size={16} />,
        text: `Due in ${daysUntilMaintenance} days`
      };
    } else {
      return {
        color: 'text-green-600',
        icon: <ArrowDown className="text-green-600" size={16} />,
        text: `Due in ${daysUntilMaintenance} days`
      };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Aircraft Status</h2>
      
      <div className="space-y-4">
        {aircraft.map(ac => {
          const maintenanceStatus = getMaintenanceStatus(ac);
          
          return (
            <div
              key={ac.id}
              className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Plane className="text-blue-600" size={24} />
                  <div>
                    <h3 className="font-medium">
                      {ac.aircraft.registration} - {ac.aircraft.model}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {ac.aircraft.client.first_name} {ac.aircraft.client.last_name}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ac.flight_status)}`}>
                  {ac.flight_status.replace('-', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{ac.current_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span>{ac.flight_hours} flight hours</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {maintenanceStatus.icon}
                    <span className={maintenanceStatus.color}>
                      {maintenanceStatus.text}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last maintenance: {new Date(ac.last_maintenance).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {ac.maintenance_notes && (
                <div className="mt-3 text-sm text-gray-600">
                  <p className="font-medium">Maintenance Notes:</p>
                  <p>{ac.maintenance_notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AssetsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl text-gray-800 mb-6">Assets</h1>
      <div className="grid grid-cols-2 gap-6">
        <InventoryList />
        <AircraftTracker />
      </div>
    </div>
  );
};

export default AssetsPage;