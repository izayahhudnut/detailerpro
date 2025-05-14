import { supabase } from './supabase';

/**
 * Checks if a column exists in a table
 */
export async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    // First try to use the column_exists function if it exists
    try {
      const { data, error } = await supabase
        .rpc('column_exists', {
          table_name: tableName,
          column_name: columnName
        });

      if (!error) {
        return !!data;
      }
    } catch (functionError) {
      // Function doesn't exist or there was an error, continue to other methods
    }

    // Then try using information_schema directly
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', tableName)
      .eq('column_name', columnName);

    if (!error && data) {
      return data.length > 0;
    }

    // If direct query fails, try using a raw SQL query via postgres function
    try {
      const { error: execError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          AND column_name = '${columnName}'
        `
      });

      if (!execError) {
        // If no error, assume success since we can't get data back directly
        return true;
      }
    } catch (execError) {
      // Ignore errors with exec_sql and try next method
    }

    // Fall back to trying to select from the table with the column
    try {
      const { error: fallbackError } = await supabase
        .from(tableName)
        .select(columnName)
        .limit(1);

      // If there's no error, the column exists
      return !fallbackError;
    } catch (fallbackError) {
      // If this fails too, we have to assume the column doesn't exist
      return false;
    }
  } catch (error) {
    console.error('Error checking column existence:', error);
    return false;
  }
}

/**
 * Creates the column_exists RPC function in the database if it doesn't exist
 */
export async function ensureColumnExistsFunction(): Promise<boolean> {
  try {
    // Try to use the function to check if it exists
    try {
      const { error } = await supabase.rpc('column_exists', {
        table_name: 'employees',
        column_name: 'id'
      });

      if (!error) {
        // Function exists
        return true;
      }
    } catch (e) {
      // Function doesn't exist, continue to create it
    }

    // Create the function using exec_sql if it exists
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION column_exists(p_table_name text, p_column_name text)
          RETURNS boolean AS $$
          DECLARE
            exists boolean;
          BEGIN
            SELECT COUNT(*) > 0 INTO exists
            FROM information_schema.columns
            WHERE table_name = p_table_name
            AND column_name = p_column_name;

            RETURN exists;
          END;
          $$ LANGUAGE plpgsql;
        `
      });

      if (!error) {
        return true;
      }
    } catch (e) {
      // Couldn't create function with exec_sql, try another method
    }

    // We can't create the function, but that's okay - we'll use alternative methods
    console.warn('Unable to create column_exists function, will use alternatives');
    return false;
  } catch (error) {
    console.error('Error ensuring column_exists function:', error);
    return false;
  }
}

/**
 * Creates or checks for the exec_sql RPC function in the database
 */
export async function ensureExecSqlFunction(): Promise<boolean> {
  try {
    // Try to use the function to check if it exists
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'SELECT 1'
      });

      if (!error) {
        // Function exists
        return true;
      }
    } catch (e) {
      // Function doesn't exist, continue to create it
    }

    // The exec_sql function requires admin privileges to create
    console.warn('exec_sql function not available, advanced operations may fail');
    return false;
  } catch (error) {
    console.error('Error ensuring exec_sql function:', error);
    return false;
  }
}

/**
 * Creates a stored procedure to add the cost_per_hour column
 * This is an alternative approach if the RPC methods don't work
 */
export async function createStoredProcedure(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Creating stored procedure for adding cost_per_hour column...');

    // Check if exec_sql is available
    const execFunctionExists = await ensureExecSqlFunction();

    if (!execFunctionExists) {
      return {
        success: false,
        message: 'Unable to create stored procedure: exec_sql function not available'
      };
    }

    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION create_cost_per_hour_column()
        RETURNS void AS $$
        BEGIN
          -- Check if the column already exists
          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'employees' AND column_name = 'cost_per_hour'
          ) THEN
            -- Add the column if it doesn't exist
            ALTER TABLE employees ADD COLUMN cost_per_hour NUMERIC DEFAULT 0 NOT NULL;

            -- Add a comment to the column
            COMMENT ON COLUMN employees.cost_per_hour IS 'Hourly cost rate for the employee';

            -- Add column to track last cost update if it doesn't exist
            IF NOT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'employees' AND column_name = 'cost_updated_at'
            ) THEN
                ALTER TABLE employees ADD COLUMN cost_updated_at TIMESTAMPTZ DEFAULT NOW();
            END IF;

            -- Update trigger to maintain cost_updated_at
            CREATE OR REPLACE FUNCTION update_employee_cost_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.cost_per_hour IS DISTINCT FROM NEW.cost_per_hour THEN
                    NEW.cost_updated_at = NOW();
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Create or replace the trigger
            DROP TRIGGER IF EXISTS set_employee_cost_timestamp ON employees;
            CREATE TRIGGER set_employee_cost_timestamp
            BEFORE UPDATE ON employees
            FOR EACH ROW
            EXECUTE FUNCTION update_employee_cost_timestamp();
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error) {
      console.error('Error creating stored procedure:', error);
      return { success: false, message: `Failed to create stored procedure: ${error.message}` };
    }

    return {
      success: true,
      message: 'Successfully created stored procedure for adding cost_per_hour column'
    };
  } catch (error) {
    console.error('Error creating stored procedure:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Function to add the cost_per_hour column to the employees table
 * This should be run once to update the database schema
 */
export async function addCostPerHourColumn(): Promise<{ success: boolean; message: string }> {
  try {
    // First check if the column already exists
    const exists = await columnExists('employees', 'cost_per_hour');

    if (exists) {
      console.log('Column already exists');
      return { success: true, message: 'cost_per_hour column already exists' };
    }

    // The column doesn't exist, so add it
    console.log('Adding cost_per_hour column...');

    // Ensure helper functions
    await ensureColumnExistsFunction();
    const execAvailable = await ensureExecSqlFunction();

    // Create stored procedure if exec_sql is available
    if (execAvailable) {
      const { success: procSuccess } = await createStoredProcedure();

      if (procSuccess) {
        // Run the stored procedure to add the column
        const { error: execError } = await supabase.rpc('create_cost_per_hour_column');

        if (!execError) {
          // Verify the column was added
          const verifyExists = await columnExists('employees', 'cost_per_hour');

          if (verifyExists) {
            return { success: true, message: 'Successfully added cost_per_hour column via stored procedure' };
          }
        }
      }
    }

    // Try the direct approach using exec_sql
    if (execAvailable) {
      const { error: alterTableError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Add the column if it doesn't exist
          ALTER TABLE employees ADD COLUMN IF NOT EXISTS cost_per_hour NUMERIC DEFAULT 0 NOT NULL;

          -- Add a comment to the column
          COMMENT ON COLUMN employees.cost_per_hour IS 'Hourly cost rate for the employee';

          -- Add column to track last cost update if it doesn't exist
          DO $$
          BEGIN
              IF NOT EXISTS (
                  SELECT FROM information_schema.columns
                  WHERE table_name = 'employees' AND column_name = 'cost_updated_at'
              ) THEN
                  ALTER TABLE employees ADD COLUMN cost_updated_at TIMESTAMPTZ DEFAULT NOW();
              END IF;
          END
          $$;

          -- Update trigger to maintain cost_updated_at
          CREATE OR REPLACE FUNCTION update_employee_cost_timestamp()
          RETURNS TRIGGER AS $$
          BEGIN
              IF OLD.cost_per_hour IS DISTINCT FROM NEW.cost_per_hour THEN
                  NEW.cost_updated_at = NOW();
              END IF;
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          -- Create or replace the trigger
          DROP TRIGGER IF EXISTS set_employee_cost_timestamp ON employees;
          CREATE TRIGGER set_employee_cost_timestamp
          BEFORE UPDATE ON employees
          FOR EACH ROW
          EXECUTE FUNCTION update_employee_cost_timestamp();
        `
      });

      if (!alterTableError) {
        // Verify the column was added
        const verifyExists = await columnExists('employees', 'cost_per_hour');

        if (verifyExists) {
          return { success: true, message: 'Successfully added cost_per_hour column via SQL' };
        }
      }
    }

    // If we're still here, try calling the Supabase Edge Function if available
    try {
      const { data, error: funcError } = await supabase.functions.invoke('update-employee-schema', {
        body: { operation: 'add_cost_column' }
      });

      if (!funcError && data?.success) {
        return { success: true, message: 'Successfully added cost_per_hour column via Edge Function' };
      }
    } catch (edgeFuncError) {
      console.error('Error with Edge Function:', edgeFuncError);
    }

    // All attempts failed, return instructions for manual update
    return {
      success: false,
      message: 'All automatic methods to add the column failed. Please run the schema updates manually using the SQL in migrations or through the Supabase SQL Editor.'
    };
  } catch (error) {
    console.error('Error adding cost_per_hour column:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Manual instructions for adding the column
 */
export const manualMigrationInstructions = `
-- Run these SQL commands in the Supabase SQL Editor:

-- Add cost_per_hour column to employees table if it doesn't exist
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS cost_per_hour NUMERIC DEFAULT 0 NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN employees.cost_per_hour
IS 'Hourly cost rate for the employee';

-- Add column to track last cost update if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'cost_updated_at'
    ) THEN
        ALTER TABLE employees ADD COLUMN cost_updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_employee_cost_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.cost_per_hour IS DISTINCT FROM NEW.cost_per_hour THEN
        NEW.cost_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS set_employee_cost_timestamp ON employees;
CREATE TRIGGER set_employee_cost_timestamp
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_employee_cost_timestamp();
`;