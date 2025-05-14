import { v4 as uuidv4 } from 'uuid';

export interface FlightData {
  id: string;
  ident: string;
  ident_icao: string;
  ident_iata: string;
  fa_flight_id: string;
  origin: {
    code: string;
    code_icao: string;
    code_iata: string;
    code_lid: string;
    timezone: string;
    name: string;
    city: string;
  };
  destination: {
    code: string;
    code_icao: string;
    code_iata: string;
    code_lid: string;
    timezone: string;
    name: string;
    city: string;
  };
  aircraft_type: string;
  registration: string;
  status: string;
  actual_off?: string;
  actual_on?: string;
  predicted_off?: string;
  predicted_on?: string;
  last_position?: {
    altitude: number;
    groundspeed: number;
    heading: number;
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export interface FlightPosition {
  altitude: number;
  groundspeed: number;
  heading: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface FlightRoute {
  route_distance: number;
  fixes: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface MaintenanceRecommendation {
  type: 'routine' | 'inspection' | 'overhaul';
  urgency: 'low' | 'medium' | 'high';
  reason: string;
  recommended_date: string;
}

class FlightNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlightNotFoundError';
  }
}

class InvalidFlightNumberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFlightNumberError';
  }
}

// Mock data for development/demo purposes
const mockFlightData: FlightData = {
  id: uuidv4(),
  ident: "AAL171",
  ident_icao: "AAL171",
  ident_iata: "AA171",
  fa_flight_id: "AAL171-1677433740-airline-0001",
  origin: {
    code: "DFW",
    code_icao: "KDFW",
    code_iata: "DFW",
    code_lid: "KDFW",
    timezone: "America/Chicago",
    name: "Dallas/Fort Worth International",
    city: "Dallas"
  },
  destination: {
    code: "LAX",
    code_icao: "KLAX",
    code_iata: "LAX",
    code_lid: "KLAX",
    timezone: "America/Los_Angeles",
    name: "Los Angeles International",
    city: "Los Angeles"
  },
  aircraft_type: "Boeing 737-800",
  registration: "N123AA",
  status: "in_air",
  actual_off: new Date().toISOString(),
  predicted_on: new Date(Date.now() + 3600000).toISOString(),
  last_position: {
    altitude: 35000,
    groundspeed: 450,
    heading: 270,
    latitude: 32.8968,
    longitude: -97.038,
    timestamp: new Date().toISOString()
  }
};

export class FlightAwareAPI {
  private validateFlightNumber(ident: string): boolean {
    const flightNumberPattern = /^[A-Z0-9]{2,3}\d{1,4}$/i;
    return flightNumberPattern.test(ident.replace(/\s+/g, ''));
  }

  async getFlightInfo(ident: string): Promise<FlightData> {
    // Remove any whitespace and convert to uppercase
    const cleanIdent = ident.replace(/\s+/g, '').toUpperCase();

    if (!this.validateFlightNumber(cleanIdent)) {
      throw new InvalidFlightNumberError('Invalid flight number format. Example: AA123 or UAL1234');
    }

    // For development/demo, return mock data with the requested flight number
    // In a real implementation, this would make an API call to FlightAware
    
    // Generate a random flight duration between 1-8 hours
    const flightDurationMs = (1 + Math.random() * 7) * 3600000;
    const departureTime = new Date();
    const arrivalTime = new Date(departureTime.getTime() + flightDurationMs);
    
    // Randomize the status
    const statuses = ['scheduled', 'in_air', 'landed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate random origin and destination
    const airports = [
      { code: "DFW", code_icao: "KDFW", code_iata: "DFW", code_lid: "KDFW", timezone: "America/Chicago", name: "Dallas/Fort Worth International", city: "Dallas" },
      { code: "LAX", code_icao: "KLAX", code_iata: "LAX", code_lid: "KLAX", timezone: "America/Los_Angeles", name: "Los Angeles International", city: "Los Angeles" },
      { code: "JFK", code_icao: "KJFK", code_iata: "JFK", code_lid: "KJFK", timezone: "America/New_York", name: "John F. Kennedy International", city: "New York" },
      { code: "MIA", code_icao: "KMIA", code_iata: "MIA", code_lid: "KMIA", timezone: "America/New_York", name: "Miami International", city: "Miami" },
      { code: "ORD", code_icao: "KORD", code_iata: "ORD", code_lid: "KORD", timezone: "America/Chicago", name: "O'Hare International", city: "Chicago" }
    ];
    
    const originIndex = Math.floor(Math.random() * airports.length);
    let destIndex = Math.floor(Math.random() * airports.length);
    while (destIndex === originIndex) {
      destIndex = Math.floor(Math.random() * airports.length);
    }
    
    // Generate a random aircraft registration
    const registration = `N${Math.floor(100 + Math.random() * 900)}${cleanIdent.slice(0, 2)}`;
    
    return {
      id: uuidv4(),
      ident: cleanIdent,
      ident_icao: cleanIdent,
      ident_iata: cleanIdent.slice(0, 2) + cleanIdent.slice(2),
      fa_flight_id: `${cleanIdent}-${Date.now()}-airline-0001`,
      origin: airports[originIndex],
      destination: airports[destIndex],
      aircraft_type: "Boeing 737-800",
      registration: registration,
      status: randomStatus,
      actual_off: departureTime.toISOString(),
      predicted_on: arrivalTime.toISOString(),
      last_position: randomStatus === 'in_air' ? {
        altitude: 25000 + Math.random() * 15000,
        groundspeed: 400 + Math.random() * 100,
        heading: Math.floor(Math.random() * 360),
        latitude: 30 + Math.random() * 10,
        longitude: -100 + Math.random() * 30,
        timestamp: new Date().toISOString()
      } : undefined
    };
  }

  async getFlightTrack(flightId: string): Promise<FlightPosition[]> {
    // Return mock track data
    const positions: FlightPosition[] = [];
    const baseTime = Date.now();
    const numPoints = 10 + Math.floor(Math.random() * 20); // 10-30 points
    
    // Create a somewhat realistic flight path
    const startLat = 30 + Math.random() * 10;
    const startLon = -120 + Math.random() * 40;
    const endLat = 30 + Math.random() * 10;
    const endLon = -90 + Math.random() * 30;
    
    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1);
      positions.push({
        altitude: 30000 + Math.sin(progress * Math.PI) * 5000, // Climb, cruise, descend pattern
        groundspeed: 450 + Math.sin(progress * Math.PI) * 50,
        heading: Math.floor(Math.random() * 10) + 270, // Slight variations in heading
        latitude: startLat + (endLat - startLat) * progress + (Math.random() - 0.5) * 0.5, // Add some randomness
        longitude: startLon + (endLon - startLon) * progress + (Math.random() - 0.5) * 0.5,
        timestamp: new Date(baseTime - (numPoints - i) * 300000).toISOString() // Every 5 minutes
      });
    }

    return positions;
  }

  async getFlightRoute(flightId: string): Promise<FlightRoute | null> {
    // Generate a realistic route with waypoints
    const waypoints = [
      "KSLC", "KDEN", "KORD", "KJFK", "KATL", "KDFW", "KPHX", "KLAX", "KSFO",
      "EDDF", "EGLL", "LFPG", "EHAM", "LEMD", "LIRF", "LTBA"
    ];
    
    // Pick 3-7 random waypoints
    const numWaypoints = 3 + Math.floor(Math.random() * 5);
    const selectedWaypoints = [];
    
    for (let i = 0; i < numWaypoints; i++) {
      const randomIndex = Math.floor(Math.random() * waypoints.length);
      selectedWaypoints.push(waypoints[randomIndex]);
      waypoints.splice(randomIndex, 1); // Remove to avoid duplicates
    }
    
    // Generate coordinates for each waypoint
    const fixes = selectedWaypoints.map(name => ({
      name,
      latitude: 30 + Math.random() * 20,
      longitude: -120 + Math.random() * 60
    }));
    
    return {
      route_distance: Math.floor(500 + Math.random() * 2000), // 500-2500 nm
      fixes
    };
  }

  async getFlightPosition(flightId: string): Promise<FlightPosition | null> {
    // Return mock current position
    return {
      altitude: 30000 + Math.floor(Math.random() * 10000),
      groundspeed: 400 + Math.floor(Math.random() * 150),
      heading: Math.floor(Math.random() * 360),
      latitude: 30 + Math.random() * 20,
      longitude: -100 + Math.random() * 40,
      timestamp: new Date().toISOString()
    };
  }

  async getMaintenanceRecommendations(registration: string, flightHours: number): Promise<MaintenanceRecommendation[]> {
    // In a real implementation, this would analyze flight data and maintenance history
    // to generate intelligent maintenance recommendations
    
    const recommendations: MaintenanceRecommendation[] = [];
    
    // Basic logic based on flight hours
    if (flightHours > 1000) {
      recommendations.push({
        type: 'overhaul',
        urgency: 'high',
        reason: 'Aircraft has exceeded 1000 flight hours since last major maintenance',
        recommended_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    } else if (flightHours > 500) {
      recommendations.push({
        type: 'inspection',
        urgency: 'medium',
        reason: 'Aircraft has exceeded 500 flight hours since last inspection',
        recommended_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
    } else if (flightHours > 100) {
      recommendations.push({
        type: 'routine',
        urgency: 'low',
        reason: 'Routine maintenance recommended based on flight hours',
        recommended_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return recommendations;
  }
}

// Export a singleton instance
export const flightAware = new FlightAwareAPI();