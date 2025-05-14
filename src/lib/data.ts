import { supabase } from './supabase';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  hire_date: string;
  status: 'active' | 'inactive';
  certifications: string[];
  cost_per_hour?: number;
  created_at?: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  created_at?: string;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
  year: string;
  client_id: string;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  description?: string;
  quantity: number;
  minimum_stock: number;
  unit: string;
  location?: string;
  cost_per_unit: number;
  last_restocked?: string;
  created_at?: string;
}

export interface JobInventoryUsage {
  id: string;
  job_id: string;
  item_id: string;
  quantity_used: number;
  cost_at_time: number;
  used_at: string;
  created_at?: string;
}

export interface ProgressStep {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  order_number: number;
  created_at?: string;
}

export interface ProgressTemplate {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  steps: ProgressStep[];
}

export interface Todo {
  id: string;
  job_id: string;
  step_id: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
}

// Progress todo functions
/**
 * Toggles a todo (progress step) for a job. Inserts or updates the record.
 */
/**
 * Toggles a todo (progress step) for a job. Inserts or updates the record in the database.
 */
export const toggleTodo = async (
  job_id: string,
  step_id: string,
  completed: boolean
): Promise<Todo | null> => {
  const now = completed ? new Date().toISOString() : null;
  try {
    console.log(`Toggling todo for job ${job_id}, step ${step_id} to ${completed}`);
    
    // First check if the todo exists
    const { data: existingTodo, error: checkError } = await supabase
      .from('todos')
      .select('*')
      .eq('job_id', job_id)
      .eq('step_id', step_id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking todo existence:', checkError);
      throw checkError;
    }
    
    let result;
    
    if (existingTodo) {
      // Update existing todo
      console.log('Updating existing todo:', existingTodo);
      const { data, error } = await supabase
        .from('todos')
        .update({ 
          completed, 
          completed_at: now,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTodo.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
      console.log('Updated todo successfully:', result);
    } else {
      // Insert new todo
      console.log('Creating new todo for job_id:', job_id, 'step_id:', step_id);
      const { data, error } = await supabase
        .from('todos')
        .insert({ 
          job_id, 
          step_id, 
          description: '', 
          completed, 
          completed_at: now 
        })
        .select()
        .single();
        
      if (error) throw error;
      result = data;
      console.log('Created new todo successfully:', result);
    }
    
    // Also save to localStorage as a backup in case of network issues
    const storageKey = `todo_${job_id}_${step_id}`;
    localStorage.setItem(storageKey, JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('Error toggling todo:', error);
    
    // On error, try to use localStorage as fallback
    try {
      console.log('Using localStorage as fallback due to database error');
      const storageKey = `todo_${job_id}_${step_id}`;
      const todo: Todo = {
        id: `${job_id}_${step_id}`, // Create a compound ID
        job_id,
        step_id,
        description: '',
        completed,
        completed_at: now
      };
      
      localStorage.setItem(storageKey, JSON.stringify(todo));
      return todo;
    } catch (localError) {
      console.error('localStorage fallback also failed:', localError);
      return null;
    }
  }
};

export interface MaintenanceJob {
  id: string;
  title: string;
  description?: string;
  vehicle_id: string;
  employee_id?: string;
  crew_id?: string;
  start_time: string;
  duration: number;
  status: 'not-started' | 'in-progress' | 'qa' | 'done';
  template_id?: string;
  notification_phone?: string;
  created_at?: string;
  updated_at?: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    registration: string;
    client: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
  employee?: {
    id: string;
    name: string;
    specialization: string;
  };
  crew?: Crew;
  todos?: Todo[];
  inventory_usage?: JobInventoryUsage[];
}

// Client functions
export const getClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        vehicles (*)
      `);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};

export const addClient = async (client: Omit<Client, 'id' | 'created_at'>): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding client:', error);
    return null;
  }
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
};

export const deleteClient = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};

// Vehicle functions
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
};

export const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    return null;
  }
};

export const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return null;
  }
};

export const deleteVehicle = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return false;
  }
};

// SMS Notification function
export const sendSmsNotification = async (phoneNumber: string, message: string): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('send-sms', {
      body: { phoneNumber, message }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    throw error;
  }
};

// Employee functions
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*');

    if (error) throw error;

    // Log the employee data to debug cost_per_hour issues
    if (data && data.length > 0) {
      console.log('Fetched employees with cost_per_hour values:');
      data.forEach(emp => {
        console.log(`Employee ${emp.name} (${emp.id}): cost_per_hour = ${emp.cost_per_hour}, type = ${typeof emp.cost_per_hour}`);
      });
    } else {
      console.log('No employees found or empty data returned');
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const addEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee | null> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        specialization: employee.specialization,
        hire_date: employee.hire_date,
        status: employee.status,
        certifications: employee.certifications,
        cost_per_hour: employee.cost_per_hour || 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding employee:', error);
    return null;
  }
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee | null> => {
  try {
    console.log('Updating employee with ID:', id);
    console.log('Employee update data:', updates);

    // Fetch the employee first to verify it exists
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching employee before update:', fetchError);
      return null;
    }

    if (!existingEmployee) {
      console.error(`Employee with ID ${id} not found`);
      return null;
    }

    // Create a clean updates object with fields we know exist in the database
    const cleanUpdates: Partial<Employee> = {};

    // Add the fields we want to update
    if (updates.name) cleanUpdates.name = updates.name;
    if (updates.phone) cleanUpdates.phone = updates.phone;
    if (updates.specialization) cleanUpdates.specialization = updates.specialization;
    if (updates.hire_date) cleanUpdates.hire_date = updates.hire_date;
    if (updates.status) cleanUpdates.status = updates.status;
    if (updates.certifications) cleanUpdates.certifications = updates.certifications;

    // Include cost_per_hour field now that the database schema has been updated
    if (updates.cost_per_hour !== undefined) {
      cleanUpdates.cost_per_hour = typeof updates.cost_per_hour === 'string'
        ? parseFloat(updates.cost_per_hour)
        : updates.cost_per_hour;
    }

    console.log('Cleaned employee update data:', cleanUpdates);

    const { data, error } = await supabase
      .from('employees')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:',
        error.code,
        error.message,
        error.details,
        error.hint
      );
      return null;
    }

    console.log('Employee updated successfully:', data);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating employee:', error.message);
    } else {
      console.error('Unknown error updating employee:', error);
    }

    // Return null instead of throwing
    return null;
  }
};

export const deleteEmployee = async (id: string): Promise<boolean> => {
  try {
    console.log('Attempting to delete employee with ID:', id);

    // First fetch the employee to make sure it exists
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error checking if employee exists:', fetchError);
      return false;
    }

    if (!existingEmployee) {
      console.error(`Cannot delete: Employee with ID ${id} not found`);
      return false;
    }

    // Try to delete the employee
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting employee:',
        error.code,
        error.message,
        error.details,
        error.hint
      );
      return false;
    }

    console.log('Employee deleted successfully');
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting employee:', error.message);
    } else {
      console.error('Unknown error deleting employee:', error);
    }
    return false;
  }
};

// Inventory functions
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem | null> => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return null;
  }
};

export const addInventoryUsage = async (usage: Omit<JobInventoryUsage, 'id' | 'created_at'>): Promise<JobInventoryUsage> => {
  try {
    // First, check if there's enough inventory available
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', usage.item_id)
      .single();

    if (inventoryError) throw inventoryError;

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    if (inventoryItem.quantity < usage.quantity_used) {
      throw new Error(`Insufficient inventory. Only ${inventoryItem.quantity} available.`);
    }

    // Add the usage record
    const { data, error } = await supabase
      .from('job_inventory')
      .insert({
        ...usage,
        used_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update the inventory quantity
    const newQuantity = inventoryItem.quantity - usage.quantity_used;
    await updateInventoryQuantity(usage.item_id, newQuantity);

    return data as JobInventoryUsage;
  } catch (error) {
    console.error('Error adding inventory usage:', error);
    throw error;
  }
};

// Progress template functions
export const getProgressTemplate = async (templateId: string): Promise<ProgressTemplate | null> => {
  try {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('progress_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;
    if (!template) return null;

    // Get steps
    const { data: steps, error: stepsError } = await supabase
      .from('progress_steps')
      .select('*')
      .eq('template_id', templateId)
      .order('order_number');

    if (stepsError) throw stepsError;

    return {
      ...template,
      steps: steps || []
    };
  } catch (error) {
    console.error('Error fetching progress template:', error);
    return null;
  }
};

export const addProgressTemplate = async (template: Omit<ProgressTemplate, 'id'>): Promise<ProgressTemplate | null> => {
  try {
    // Insert template
    const { data: newTemplate, error: templateError } = await supabase
      .from('progress_templates')
      .insert({
        name: template.name,
        description: template.description
      })
      .select()
      .single();

    if (templateError) throw templateError;
    if (!newTemplate) throw new Error('Failed to create template');

    // Insert steps
    const stepsToInsert = template.steps.map(step => ({
      template_id: newTemplate.id,
      title: step.title,
      description: step.description,
      order_number: step.order_number
    }));

    const { data: steps, error: stepsError } = await supabase
      .from('progress_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) throw stepsError;

    return {
      ...newTemplate,
      steps: steps || []
    };
  } catch (error) {
    console.error('Error adding progress template:', error);
    return null;
  }
};

// Maintenance job functions
export const getMaintenanceJobs = async (): Promise<MaintenanceJob[]> => {
  try {
    // Fetch the maintenance jobs
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .select(`
        *,
        vehicle:vehicles (
          id,
          make,
          model,
          registration,
          client:clients (
            id,
            first_name,
            last_name
          )
        ),
        employee:employees (
          id,
          name,
          specialization
        ),
        crew:crews (
          id,
          name,
          description
        )
      `)
      .order('start_time', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch todos for all jobs in one batch query
    const jobIds = data.map(job => job.id);
    const { data: allTodos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .in('job_id', jobIds);

    if (todosError) {
      console.error('Error fetching todos for jobs:', todosError);
      // If there's an error fetching from the database, we'll try localStorage as fallback
    }

    // Fetch inventory usage for all jobs
    const { data: allInventoryUsage, error: inventoryError } = await supabase
      .from('job_inventory')
      .select('*, item:inventory(id, name, unit, quantity, minimum_stock, cost_per_unit)')
      .in('job_id', jobIds);

    if (inventoryError) {
      console.error('Error fetching inventory usage for jobs:', inventoryError);
    } else {
      console.log('Fetched inventory usage for jobs:', allInventoryUsage);
    }

    // Group todos by job_id for easier access
    const todosByJobId: Record<string, Todo[]> = {};
    if (allTodos) {
      allTodos.forEach(todo => {
        if (!todosByJobId[todo.job_id]) {
          todosByJobId[todo.job_id] = [];
        }
        todosByJobId[todo.job_id].push(todo);
      });
      console.log('Grouped todos by job_id:', todosByJobId);
    }

    // Group inventory usage by job_id
    const inventoryByJobId: Record<string, JobInventoryUsage[]> = {};
    if (allInventoryUsage) {
      allInventoryUsage.forEach(usage => {
        if (!inventoryByJobId[usage.job_id]) {
          inventoryByJobId[usage.job_id] = [];
        }
        inventoryByJobId[usage.job_id].push(usage);
      });
      console.log('Grouped inventory usage by job_id:', inventoryByJobId);
    }

    // Map jobs with their todos and inventory usage
    const jobsWithData = data.map((job) => {
      try {
        // Get todos from database results
        let todos = todosByJobId[job.id] || [];

        // Get inventory usage
        const inventoryUsage = inventoryByJobId[job.id] || [];

        // If no todos found in database or there was an error, try localStorage as fallback
        if (todos.length === 0 || todosError) {
          console.log(`No todos found in database for job ${job.id}, checking localStorage...`);

          // Find all localStorage keys that start with `todo_${job.id}_`
          const localTodos: Todo[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`todo_${job.id}_`)) {
              try {
                const todoStr = localStorage.getItem(key);
                if (todoStr) {
                  const todo = JSON.parse(todoStr);
                  localTodos.push(todo);
                }
              } catch (e) {
                console.error(`Error parsing todo from localStorage for key ${key}:`, e);
              }
            }
          }

          if (localTodos.length > 0) {
            console.log(`Found ${localTodos.length} todos in localStorage for job ${job.id}`);
            todos = localTodos;

            // If we found todos in localStorage but not in database, try to sync them to database
            localTodos.forEach(async (todo) => {
              try {
                await supabase
                  .from('todos')
                  .upsert({
                    id: todo.id.includes('_') ? undefined : todo.id, // Only use id if it's a real UUID
                    job_id: todo.job_id,
                    step_id: todo.step_id,
                    description: todo.description || '',
                    completed: todo.completed,
                    completed_at: todo.completed_at
                  }, { onConflict: 'job_id,step_id' });
              } catch (e) {
                console.error('Error syncing todo from localStorage to database:', e);
              }
            });
          }
        }

        console.log(`Job ${job.id} has ${todos.length} todos and ${inventoryUsage.length} inventory items`);

        return {
          ...job,
          vehicle: {
            ...job.vehicle,
            client: job.vehicle.client
          },
          employee: job.employee,
          crew: job.crew,
          todos: todos,
          inventory_usage: inventoryUsage
        };
      } catch (e) {
        console.error(`Error processing data for job ${job.id}:`, e);
        return {
          ...job,
          vehicle: {
            ...job.vehicle,
            client: job.vehicle.client
          },
          employee: job.employee,
          crew: job.crew,
          todos: [],
          inventory_usage: []
        };
      }
    });

    return jobsWithData;
  } catch (error) {
    console.error('Error fetching maintenance jobs:', error);
    return [];
  }
};

export const addMaintenanceJob = async (job: Omit<MaintenanceJob, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceJob | null> => {
  try {
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .insert({
        title: job.title,
        description: job.description,
        vehicle_id: job.vehicle_id,
        employee_id: job.employee_id,
        crew_id: job.crew_id,
        start_time: job.start_time,
        duration: job.duration,
        status: job.status,
        template_id: job.template_id,
        notification_phone: job.notification_phone
      })
      .select(`
        *,
        vehicle:vehicles (
          id,
          make,
          model,
          registration,
          client:clients (
            id,
            first_name,
            last_name
          )
        ),
        employee:employees (
          id,
          name,
          specialization
        ),
        crew:crews (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) throw error;

    // Transform the response to match the expected interface
    return data ? {
      ...data,
      vehicle: {
        ...data.vehicle,
        client: data.vehicle.client
      },
      employee: data.employee,
      crew: data.crew
    } : null;
  } catch (error) {
    console.error('Error adding maintenance job:', error);
    return null;
  }
};

export const updateMaintenanceJob = async (id: string, updates: Partial<MaintenanceJob>): Promise<MaintenanceJob | null> => {
  try {
    console.log(`Updating maintenance job ${id}:`, updates);

    // Check if this is just a status update (for drag and drop)
    if (Object.keys(updates).length === 1 && updates.status) {
      console.log('Simple status update detected');

      // Simple status update
      const { error } = await supabase
        .from('maintenance_jobs')
        .update({ status: updates.status })
        .eq('id', id);

      if (error) throw error;

      // Fetch the complete job data
      const { data: updatedJob } = await supabase
        .from('maintenance_jobs')
        .select(`
          *,
          vehicle:vehicles (
            id,
            make,
            model,
            registration,
            client:clients (
              id,
              first_name,
              last_name
            )
          ),
          employee:employees (
            id,
            name,
            specialization
          ),
          crew:crews (
            id,
            name,
            description
          )
        `)
        .eq('id', id)
        .single();

      if (!updatedJob) return null;

      // Fetch todos and inventory usage for the job
      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('job_id', id);

      const { data: inventoryUsage, error: invUsageError } = await supabase
        .from('job_inventory')
        .select('*, item:inventory(id, name, unit, quantity, minimum_stock, cost_per_unit)')
        .eq('job_id', id);

      if (invUsageError) {
        console.error('Error fetching inventory usage for job:', invUsageError);
      } else {
        console.log('Fetched inventory usage for status update job:', inventoryUsage);
      }

      return {
        ...updatedJob,
        vehicle: {
          ...updatedJob.vehicle,
          client: updatedJob.vehicle.client
        },
        employee: updatedJob.employee,
        crew: updatedJob.crew,
        todos: todos || [],
        inventory_usage: inventoryUsage || []
      };
    }

    // Extract todos and inventory_usage from updates for complex updates
    const { todos, inventory_usage, ...jobUpdates } = updates;

    // Update the maintenance job in the database
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .update(jobUpdates)
      .eq('id', id)
      .select(`
        *,
        vehicle:vehicles (
          id,
          make,
          model,
          registration,
          client:clients (
            id,
            first_name,
            last_name
          )
        ),
        employee:employees (
          id,
          name,
          specialization
        ),
        crew:crews (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch todos from database
    const { data: dbTodos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .eq('job_id', id);

    let updatedTodos: Todo[] = [];

    if (todosError) {
      console.error(`Error fetching todos for job ${id}:`, todosError);
      // If DB fetch fails, try localStorage as fallback
      console.log('Trying localStorage fallback for todos...');

      // Find all localStorage keys that start with `todo_${id}_`
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`todo_${id}_`)) {
          try {
            const todoStr = localStorage.getItem(key);
            if (todoStr) {
              const todo = JSON.parse(todoStr);
              updatedTodos.push(todo);
            }
          } catch (e) {
            console.error(`Error parsing todo from localStorage for key ${key}:`, e);
          }
        }
      }
    } else {
      updatedTodos = dbTodos || [];
      console.log(`Found ${updatedTodos.length} todos for job ${id} in database`);
    }

    // Fetch inventory usage from database
    const { data: dbInventory, error: inventoryError } = await supabase
      .from('job_inventory')
      .select('*, item:inventory(id, name, unit, quantity, minimum_stock, cost_per_unit)')
      .eq('job_id', id);

    let updatedInventory: JobInventoryUsage[] = [];

    if (inventoryError) {
      console.error(`Error fetching inventory usage for job ${id}:`, inventoryError);
    } else {
      updatedInventory = dbInventory || [];
      console.log(`Found ${updatedInventory.length} inventory items for job ${id} in database:`, dbInventory);
    }

    // If new todos were provided in the update, save them to database
    if (todos && todos.length > 0) {
      console.log('Updating todos in database:', todos);

      // Process each todo
      for (const todo of todos) {
        try {
          if (todo.id && !todo.id.includes('_')) { // Has a proper database ID
            // Update existing todo
            await supabase
              .from('todos')
              .update({
                completed: todo.completed,
                completed_at: todo.completed_at,
                description: todo.description || '',
                updated_at: new Date().toISOString()
              })
              .eq('id', todo.id);
          } else {
            // Insert or update based on job_id and step_id
            await supabase
              .from('todos')
              .upsert({
                job_id: todo.job_id,
                step_id: todo.step_id,
                description: todo.description || '',
                completed: todo.completed,
                completed_at: todo.completed_at
              }, { onConflict: 'job_id,step_id' });
          }

          // Also update in localStorage as backup
          const storageKey = `todo_${todo.job_id}_${todo.step_id}`;
          localStorage.setItem(storageKey, JSON.stringify(todo));
        } catch (e) {
          console.error(`Error updating todo in database:`, e);
        }
      }

      // Refresh todos from database after updates
      try {
        const { data: refreshedTodos, error: refreshError } = await supabase
          .from('todos')
          .select('*')
          .eq('job_id', id);

        if (!refreshError && refreshedTodos) {
          updatedTodos = refreshedTodos;
          console.log(`Refreshed todos from database, now have ${updatedTodos.length} todos`);
        }
      } catch (e) {
        console.error('Error refreshing todos from database:', e);
      }
    }

    // If new inventory usage was provided, make sure it's included
    if (inventory_usage && inventory_usage.length > 0) {
      // No need to save to database as that's handled by addInventoryUsage
      // Just update our local copy if needed
      updatedInventory = [...updatedInventory];

      // Refresh inventory usage from database
      try {
        const { data: refreshedInventory, error: refreshError } = await supabase
          .from('job_inventory')
          .select('*, item:inventory(id, name, unit, quantity, minimum_stock, cost_per_unit)')
          .eq('job_id', id);

        if (!refreshError && refreshedInventory) {
          updatedInventory = refreshedInventory;
          console.log(`Refreshed inventory usage from database, now have ${updatedInventory.length} items:`, refreshedInventory);
        } else if (refreshError) {
          console.error('Error refreshing inventory usage:', refreshError);
        }
      } catch (e) {
        console.error('Error refreshing inventory usage from database:', e);
      }
    }

    // Transform the response to match the expected interface
    return {
      ...data,
      vehicle: {
        ...data.vehicle,
        client: data.vehicle.client
      },
      employee: data.employee,
      crew: data.crew,
      todos: updatedTodos,
      inventory_usage: updatedInventory
    };
  } catch (error) {
    console.error('Error updating maintenance job:', error);
    return null;
  }
};

export const deleteMaintenanceJob = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('maintenance_jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting maintenance job:', error);
    return false;
  }
};

export const getJobsByStatus = async (status: MaintenanceJob['status']): Promise<MaintenanceJob[]> => {
  try {
    // Fetch the jobs by status
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .select(`
        *,
        vehicle:vehicles (
          id,
          make,
          model,
          registration,
          client:clients (
            id,
            first_name,
            last_name
          )
        ),
        employee:employees (
          id,
          name,
          specialization
        ),
        crew:crews (
          id,
          name,
          description
        )
      `)
      .eq('status', status)
      .order('start_time', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch todos for all jobs in one batch query
    const jobIds = data.map(job => job.id);
    const { data: allTodos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .in('job_id', jobIds);

    if (todosError) {
      console.error(`Error fetching todos for jobs with status ${status}:`, todosError);
      // If there's an error fetching from the database, we'll try localStorage as fallback
    }

    // Fetch inventory usage for all jobs
    const { data: allInventoryUsage, error: inventoryError } = await supabase
      .from('job_inventory')
      .select('*, item:inventory(name, unit)')
      .in('job_id', jobIds);

    if (inventoryError) {
      console.error(`Error fetching inventory usage for jobs with status ${status}:`, inventoryError);
    }

    // Group todos by job_id for easier access
    const todosByJobId: Record<string, Todo[]> = {};
    if (allTodos) {
      allTodos.forEach(todo => {
        if (!todosByJobId[todo.job_id]) {
          todosByJobId[todo.job_id] = [];
        }
        todosByJobId[todo.job_id].push(todo);
      });
      console.log(`Grouped todos for ${Object.keys(todosByJobId).length} jobs with status ${status}`);
    }

    // Group inventory usage by job_id
    const inventoryByJobId: Record<string, JobInventoryUsage[]> = {};
    if (allInventoryUsage) {
      allInventoryUsage.forEach(usage => {
        if (!inventoryByJobId[usage.job_id]) {
          inventoryByJobId[usage.job_id] = [];
        }
        inventoryByJobId[usage.job_id].push(usage);
      });
      console.log(`Grouped inventory usage for ${Object.keys(inventoryByJobId).length} jobs with status ${status}`);
    }

    // Map jobs with their todos and inventory usage
    const jobsWithData = data.map((job) => {
      try {
        // Get todos from database results
        let todos = todosByJobId[job.id] || [];

        // Get inventory usage
        const inventoryUsage = inventoryByJobId[job.id] || [];

        // If no todos found in database or there was an error, try localStorage as fallback
        if (todos.length === 0 || todosError) {
          console.log(`No todos found in database for job ${job.id} with status ${status}, checking localStorage...`);

          // Find all localStorage keys that start with `todo_${job.id}_`
          const localTodos: Todo[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`todo_${job.id}_`)) {
              try {
                const todoStr = localStorage.getItem(key);
                if (todoStr) {
                  const todo = JSON.parse(todoStr);
                  localTodos.push(todo);
                }
              } catch (e) {
                console.error(`Error parsing todo from localStorage for key ${key}:`, e);
              }
            }
          }

          if (localTodos.length > 0) {
            console.log(`Found ${localTodos.length} todos in localStorage for job ${job.id}`);
            todos = localTodos;

            // If we found todos in localStorage but not in database, try to sync them to database
            localTodos.forEach(async (todo) => {
              try {
                await supabase
                  .from('todos')
                  .upsert({
                    id: todo.id.includes('_') ? undefined : todo.id, // Only use id if it's a real UUID
                    job_id: todo.job_id,
                    step_id: todo.step_id,
                    description: todo.description || '',
                    completed: todo.completed,
                    completed_at: todo.completed_at
                  }, { onConflict: 'job_id,step_id' });
              } catch (e) {
                console.error('Error syncing todo from localStorage to database:', e);
              }
            });
          }
        }

        console.log(`Job ${job.id} with status ${status} has ${todos.length} todos and ${inventoryUsage.length} inventory items`);

        return {
          ...job,
          vehicle: {
            ...job.vehicle,
            client: job.vehicle.client
          },
          employee: job.employee,
          crew: job.crew,
          todos: todos,
          inventory_usage: inventoryUsage
        };
      } catch (e) {
        console.error(`Error processing data for job ${job.id}:`, e);
        return {
          ...job,
          vehicle: {
            ...job.vehicle,
            client: job.vehicle.client
          },
          employee: job.employee,
          crew: job.crew,
          todos: [],
          inventory_usage: []
        };
      }
    });

    return jobsWithData;
  } catch (error) {
    console.error('Error fetching maintenance jobs by status:', error);
    return [];
  }
};

export const getProgressTemplates = async (): Promise<ProgressTemplate[]> => {
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('progress_templates')
      .select('*');

    if (templatesError) throw templatesError;
    if (!templates) return [];

    const templatesWithSteps = await Promise.all(
      templates.map(async (template) => {
        const { data: steps, error: stepsError } = await supabase
          .from('progress_steps')
          .select('*')
          .eq('template_id', template.id)
          .order('order_number');

        if (stepsError) throw stepsError;

        return {
          ...template,
          steps: steps || []
        };
      })
    );

    return templatesWithSteps;
  } catch (error) {
    console.error('Error fetching progress templates:', error);
    return [];
  }
};

export const getJobInventoryUsage = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('job_inventory')
      .select(`
        *,
        job:maintenance_jobs (
          id,
          title,
          employee:employees (
            id,
            name,
            specialization
          ),
          vehicle:vehicles (
            registration
          )
        ),
        item:inventory (
          id,
          name,
          unit,
          quantity,
          minimum_stock,
          cost_per_unit
        )
      `);

    if (error) throw error;
    console.log('Fetched all job inventory usage:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching job inventory usage:', error);
    return [];
  }
};

export const updateInventoryQuantity = async (id: string, quantity: number): Promise<InventoryItem | null> => {
  try {
    if (quantity < 0) {
      throw new Error('Inventory quantity cannot be negative');
    }

    const { data, error } = await supabase
      .from('inventory')
      .update({
        quantity,
        last_restocked: quantity > 0 ? new Date().toISOString() : undefined
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    return null;
  }
};

// This function is now redundant since updateInventoryQuantity uses 'inventory' table
export const updateInventoryQuantity2 = async (id: string, quantity: number): Promise<InventoryItem | null> => {
  return updateInventoryQuantity(id, quantity);
};

// Crew interfaces and functions
export interface Crew {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  member_count?: number;
}

export interface CrewMember {
  id: string;
  crew_id: string;
  employee_id: string;
  is_leader: boolean;
  created_at?: string;
  employee?: Employee;
}

export interface CrewWithMembers extends Crew {
  members: CrewMember[];
}

export const getCrews = async (): Promise<Crew[]> => {
  try {
    // Get all crews and count of members
    const { data, error } = await supabase
      .from('crews')
      .select(`
        *,
        member_count:crew_members(count)
      `);

    if (error) throw error;

    // Transform the data to include the member count
    const crewsWithCount = data?.map(crew => ({
      ...crew,
      member_count: crew.member_count?.[0]?.count || 0
    })) || [];

    return crewsWithCount;
  } catch (error) {
    console.error('Error fetching crews:', error);
    return [];
  }
};

export const getCrewWithMembers = async (crewId: string): Promise<CrewWithMembers | null> => {
  try {
    // Get the crew
    const { data: crew, error: crewError } = await supabase
      .from('crews')
      .select('*')
      .eq('id', crewId)
      .single();

    if (crewError) throw crewError;
    if (!crew) return null;

    // Get the crew members with employee details
    const { data: crewMembers, error: membersError } = await supabase
      .from('crew_members_view')
      .select('*')
      .eq('crew_id', crewId);

    if (membersError) throw membersError;

    // Format the result
    const members = crewMembers?.map(member => ({
      id: member.id,
      crew_id: member.crew_id,
      employee_id: member.employee_id,
      is_leader: member.is_leader,
      employee: {
        id: member.employee_id,
        name: member.employee_name,
        email: member.email,
        phone: member.phone,
        specialization: member.specialization,
        status: member.status,
        certifications: [],
        cost_per_hour: member.cost_per_hour
      }
    })) || [];

    return {
      ...crew,
      members
    };
  } catch (error) {
    console.error('Error fetching crew with members:', error);
    return null;
  }
};

export const addCrew = async (crew: Omit<Crew, 'id' | 'created_at' | 'updated_at'>): Promise<Crew | null> => {
  try {
    const { data, error } = await supabase
      .from('crews')
      .insert(crew)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding crew:', error);
    return null;
  }
};

export const updateCrew = async (id: string, updates: Partial<Crew>): Promise<Crew | null> => {
  try {
    const { data, error } = await supabase
      .from('crews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating crew:', error);
    return null;
  }
};

export const deleteCrew = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('crews')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting crew:', error);
    return false;
  }
};

export const addCrewMember = async (crewId: string, employeeId: string, isLeader: boolean = false): Promise<CrewMember | null> => {
  try {
    const { data, error } = await supabase
      .from('crew_members')
      .insert({
        crew_id: crewId,
        employee_id: employeeId,
        is_leader: isLeader
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding crew member:', error);
    return null;
  }
};

export const removeCrewMember = async (crewId: string, employeeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('crew_members')
      .delete()
      .eq('crew_id', crewId)
      .eq('employee_id', employeeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing crew member:', error);
    return false;
  }
};

export const updateCrewMemberRole = async (crewId: string, employeeId: string, isLeader: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('crew_members')
      .update({ is_leader: isLeader })
      .eq('crew_id', crewId)
      .eq('employee_id', employeeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating crew member role:', error);
    return false;
  }
};

export const getEmployeeCrews = async (employeeId: string): Promise<Crew[]> => {
  try {
    const { data, error } = await supabase
      .from('crew_members_view')
      .select(`
        crew_id,
        crew_name,
        crew_description,
        is_leader
      `)
      .eq('employee_id', employeeId);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.crew_id,
      name: item.crew_name,
      description: item.crew_description,
      is_leader: item.is_leader
    }));
  } catch (error) {
    console.error('Error fetching employee crews:', error);
    return [];
  }
};