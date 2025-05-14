import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Navigation, ArrowUp, RefreshCw, AlertTriangle, Search, Plus, Clock, X, Calendar, PenTool as Tool, BarChart4 } from 'lucide-react';
import { flightAware, type FlightData, type FlightPosition, type FlightRoute } from '../lib/flightaware';
import { supabase } from '../lib/supabase';

interface FlightDetailsProps {
  flight: FlightData;
  track?: FlightPosition[];
  route?: FlightRoute | null;
  onRemove: () => void;
  onScheduleMaintenance?: () => void;
}

const FlightDetails: React.FC<FlightDetailsProps> = ({ flight, track, route, onRemove, onScheduleMaintenance }) => {
  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Calculate estimated flight hours for this trip
  const calculateFlightHours = () => {
    if (!flight.actual_off && !flight.predicted_off) return 'N/A';
    if (!flight.actual_on && !flight.predicted_on) return 'N/A';
    
    const startTime = new Date(flight.actual_off || flight.predicted_off || '');
    const endTime = new Date(flight.actual_on || flight.predicted_on || '');
    
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    return durationHours.toFixed(1);
  };

  // Determine if maintenance might be needed based on flight hours
  const maintenanceStatus = () => {
    const flightHours = parseFloat(calculateFlightHours());
    if (isNaN(flightHours)) return null;
    
    if (flightHours > 8) {
      return {
        level: 'high',
        message: 'Long flight - maintenance check recommended',
        color: 'text-red-600'
      };
    } else if (flightHours > 4) {
      return {
        level: 'medium',
        message: 'Medium-length flight - routine inspection advised',
        color: 'text-yellow-600'
      };
    }
    return {
      level: 'low',
      message: 'Short flight - no immediate maintenance needed',
      color: 'text-green-600'
    };
  };

  const status = maintenanceStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Plane className="text-blue-600" size={24} />
          <div>
            <h3 className="font-medium text-gray-900">
              {flight.ident_iata} ({flight.ident_icao})
            </h3>
            <p className="text-sm text-gray-500">{flight.aircraft_type}</p>
            {flight.registration !== 'N/A' && (
              <p className="text-xs text-gray-400">{flight.registration}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              flight.status === 'in_air'
                ? 'bg-green-100 text-green-800'
                : flight.status === 'landed'
                ? 'bg-purple-100 text-purple-800'
                : flight.status === 'scheduled'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {flight.status.replace('_', ' ')}
          </span>
          <button onClick={onRemove} className="text-gray-400 hover:text-gray-600" title="Stop tracking">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="text-gray-400 mt-1" size={20} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{flight.origin.code_iata}</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium">{flight.destination.code_iata}</span>
            </div>
            <p className="text-sm text-gray-500">
              {flight.origin.city} to {flight.destination.city}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="text-gray-400 mt-1" size={20} />
          <div className="space-y-1">
            <div>
              <span className="text-sm text-gray-600">Departure: </span>
              <span className="text-sm font-medium">
                {formatTime(flight.actual_off || flight.predicted_off)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Arrival: </span>
              <span className="text-sm font-medium">
                {formatTime(flight.actual_on || flight.predicted_on)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Est. Flight Hours: </span>
              <span className="text-sm font-medium">
                {calculateFlightHours()}
              </span>
            </div>
          </div>
        </div>

        {flight.last_position && (
          <>
            <div className="flex items-center gap-3">
              <Navigation className="text-gray-400" size={20} />
              <span className="text-sm">
                {flight.last_position.heading}° at {flight.last_position.groundspeed} kts
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ArrowUp className="text-gray-400" size={20} />
              <span className="text-sm">{flight.last_position.altitude} ft</span>
            </div>
          </>
        )}

        {route && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-2">Route Information</h4>
            <p className="text-sm text-gray-600">Distance: {route.route_distance} nm</p>
            {route.fixes.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Waypoints:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {route.fixes.map((fix, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {fix.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {status && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-2">Maintenance Assessment</h4>
            <div className={`flex items-center gap-2 ${status.color}`}>
              <Tool size={16} />
              <span className="text-sm font-medium">{status.message}</span>
            </div>
            
            {status.level !== 'low' && (
              <button
                onClick={onScheduleMaintenance}
                className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                Schedule Maintenance
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface MaintenanceHistoryProps {
  registration: string;
}

const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({ registration }) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchMaintenanceHistory = async () => {
      try {
        // In a real implementation, this would fetch from the database
        // For now, we'll use mock data
        setHistory([
          {
            id: '1',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Routine Inspection',
            hours: 100,
            notes: 'All systems normal'
          },
          {
            id: '2',
            date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Engine Service',
            hours: 500,
            notes: 'Replaced oil filters'
          },
          {
            id: '3',
            date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Annual Inspection',
            hours: 1000,
            notes: 'Complete overhaul'
          }
        ]);
      } catch (err) {
        console.error('Error fetching maintenance history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceHistory();
  }, [registration]);

  if (loading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        <BarChart4 size={18} />
        Maintenance History
      </h3>
      
      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map(record => (
            <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">{record.type}</span>
                <span className="text-sm text-gray-500">
                  {new Date(record.date).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <span>At {record.hours} flight hours</span>
                {record.notes && <p className="mt-1">{record.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No maintenance records found</p>
      )}
    </div>
  );
};

interface FlightHistoryProps {
  registration: string;
}

const FlightHistory: React.FC<FlightHistoryProps> = ({ registration }) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchFlightHistory = async () => {
      try {
        // In a real implementation, this would fetch from the database
        // For now, we'll use mock data
        setHistory([
          {
            id: '1',
            flight: 'AA123',
            from: 'LAX',
            to: 'JFK',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            hours: 5.2
          },
          {
            id: '2',
            flight: 'AA456',
            from: 'JFK',
            to: 'MIA',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            hours: 2.8
          },
          {
            id: '3',
            flight: 'AA789',
            from: 'MIA',
            to: 'DFW',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            hours: 3.1
          }
        ]);
      } catch (err) {
        console.error('Error fetching flight history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightHistory();
  }, [registration]);

  if (loading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  // Calculate total flight hours
  const totalHours = history.reduce((sum, flight) => sum + flight.hours, 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Plane size={18} />
          Flight History
        </h3>
        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {totalHours.toFixed(1)} total hours
        </span>
      </div>
      
      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map(flight => (
            <div key={flight.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">{flight.flight}</span>
                <span className="text-sm text-gray-500">
                  {new Date(flight.date).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1 flex justify-between">
                <span>{flight.from} → {flight.to}</span>
                <span>{flight.hours} hours</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No flight history found</p>
      )}
    </div>
  );
};

interface ScheduleMaintenanceModalProps {
  registration: string;
  onClose: () => void;
  onSchedule: (data: any) => void;
}

const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({ 
  registration, 
  onClose,
  onSchedule
}) => {
  const [formData, setFormData] = useState({
    type: 'routine',
    date: '',
    notes: '',
    duration: '2'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Schedule Maintenance</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aircraft
            </label>
            <input
              type="text"
              value={registration}
              disabled
              className="w-full border rounded-lg px-3 py-2 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maintenance Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="routine">Routine Inspection</option>
              <option value="engine">Engine Service</option>
              <option value="avionics">Avionics Check</option>
              <option value="annual">Annual Inspection</option>
              <option value="repair">Repair</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FlightTrackingPage = () => {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [tracks, setTracks] = useState<Record<string, FlightPosition[]>>({});
  const [routes, setRoutes] = useState<Record<string, FlightRoute | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const fetchFlightDetails = async (flight: FlightData) => {
    try {
      const [trackData, routeData] = await Promise.all([
        flightAware.getFlightTrack(flight.fa_flight_id),
        flightAware.getFlightRoute(flight.fa_flight_id)
      ]);

      setTracks(prev => ({ ...prev, [flight.id]: trackData }));
      setRoutes(prev => ({ ...prev, [flight.id]: routeData }));
    } catch (err) {
      console.warn('Error fetching flight details:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;

    try {
      setLoading(true);
      setError(null);

      // Simply trim the input without format validation
      const cleanSearchTerm = searchTerm.trim();
      const flightData = await flightAware.getFlightInfo(cleanSearchTerm);

      if (!flights.some(f => f.fa_flight_id === flightData.fa_flight_id)) {
        setFlights(prev => [...prev, flightData]);
        fetchFlightDetails(flightData);
      } else {
        setError('This flight is already being tracked');
      }

      setSearchTerm('');
    } catch (err) {
      console.error('Error searching flight:', err);
      setError(err instanceof Error ? err.message : 'Failed to find flight');
    } finally {
      setLoading(false);
    }
  };

  const refreshFlights = async () => {
    if (flights.length === 0) return;

    try {
      setRefreshing(true);
      setError(null);

      const updatedFlights = await Promise.all(
        flights.map(async (flight) => {
          try {
            const updated = await flightAware.getFlightInfo(flight.ident);
            await fetchFlightDetails(updated);
            return updated;
          } catch (err) {
            console.warn(`Error updating flight ${flight.ident}:`, err);
            return flight;
          }
        })
      );

      setFlights(updatedFlights);
    } catch (err) {
      console.error('Error refreshing flights:', err);
      setError('Failed to refresh flight data');
    } finally {
      setRefreshing(false);
    }
  };

  const removeFlight = (flightId: string) => {
    setFlights(prev => prev.filter(f => f.id !== flightId));
    setTracks(prev => {
      const { [flightId]: _, ...rest } = prev;
      return rest;
    });
    setRoutes(prev => {
      const { [flightId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleScheduleMaintenance = (flight: FlightData) => {
    setSelectedAircraft(flight.registration);
    setShowMaintenanceModal(true);
  };

  const handleMaintenanceScheduled = (data: any) => {
    // In a real implementation, this would save to the database
    console.log('Maintenance scheduled:', data);
    // Show success message
    alert(`Maintenance scheduled for ${selectedAircraft} on ${new Date(data.date).toLocaleDateString()}`);
  };

  useEffect(() => {
    if (flights.length > 0) {
      const interval = setInterval(refreshFlights, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [flights]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-gray-800">Flight Tracking</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setError(null);
                }}
                placeholder="Enter flight number (e.g., AA123)"
                className="w-64 pl-10 pr-4 py-2 border rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Track</span>
            </button>
          </div>
          <button
            onClick={refreshFlights}
            disabled={refreshing || flights.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={20} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {flights.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No flights being tracked</p>
          <p className="text-sm text-gray-400 mt-2">
            Enter a flight number above to start tracking (e.g., AA123, UAL1234)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flights.map((flight) => (
                <FlightDetails
                  key={flight.id}
                  flight={flight}
                  track={tracks[flight.id]}
                  route={routes[flight.id]}
                  onRemove={() => removeFlight(flight.id)}
                  onScheduleMaintenance={() => handleScheduleMaintenance(flight)}
                />
              ))}
            </div>
          </div>
          
          {flights.length > 0 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <FlightHistory registration={flights[0].registration} />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <MaintenanceHistory registration={flights[0].registration} />
              </div>
            </div>
          )}
        </div>
      )}

      {showMaintenanceModal && selectedAircraft && (
        <ScheduleMaintenanceModal
          registration={selectedAircraft}
          onClose={() => setShowMaintenanceModal(false)}
          onSchedule={handleMaintenanceScheduled}
        />
      )}
    </div>
  );
};

export default FlightTrackingPage;