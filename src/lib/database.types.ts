export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      aircraft: {
        Row: {
          id: string
          registration: string
          model: string
          client_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          registration: string
          model: string
          client_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          registration?: string
          model?: string
          client_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      aircraft_tracking: {
        Row: {
          id: string
          aircraft_id: string
          flight_status: string | null
          current_location: string | null
          flight_hours: number | null
          last_maintenance: string | null
          next_maintenance_due: string | null
          maintenance_notes: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          aircraft_id: string
          flight_status?: string | null
          current_location?: string | null
          flight_hours?: number | null
          last_maintenance?: string | null
          next_maintenance_due?: string | null
          maintenance_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          aircraft_id?: string
          flight_status?: string | null
          current_location?: string | null
          flight_hours?: number | null
          last_maintenance?: string | null
          next_maintenance_due?: string | null
          maintenance_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_tracking_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          street: string
          city: string
          state: string
          zip_code: string
          created_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          street: string
          city: string
          state: string
          zip_code: string
          created_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          street?: string
          city?: string
          state?: string
          zip_code?: string
          created_at?: string | null
        }
        Relationships: []
      }
      employee_certifications: {
        Row: {
          id: string
          employee_id: string
          certification: string
          created_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          certification: string
          created_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          certification?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          specialization: string
          hire_date: string
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          specialization: string
          hire_date: string
          status: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          specialization?: string
          hire_date?: string
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          quantity: number
          minimum_stock: number
          unit: string
          location: string | null
          last_restocked: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          quantity?: number
          minimum_stock?: number
          unit: string
          location?: string | null
          last_restocked?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          quantity?: number
          minimum_stock?: number
          unit?: string
          location?: string | null
          last_restocked?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      job_inventory: {
        Row: {
          id: string
          job_id: string
          item_id: string
          quantity_used: number
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          item_id: string
          quantity_used: number
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          item_id?: string
          quantity_used?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_inventory_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "maintenance_jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_jobs: {
        Row: {
          id: string
          title: string
          description: string
          aircraft_id: string
          employee_id: string
          start_time: string
          duration: number
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          aircraft_id: string
          employee_id: string
          start_time: string
          duration: number
          status: string
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          aircraft_id?: string
          employee_id?: string
          start_time?: string
          duration?: number
          status?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_jobs_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_jobs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_todos: {
        Row: {
          id: string
          job_id: string
          description: string
          completed: boolean
          created_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          description: string
          completed?: boolean
          created_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          description?: string
          completed?: boolean
          created_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_todos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "maintenance_jobs"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}