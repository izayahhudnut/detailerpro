import React, { useState } from 'react';
import { addCostPerHourColumn, createStoredProcedure, manualMigrationInstructions } from '../lib/schema-update';
import { supabase } from '../lib/supabase';

const SchemaUpdatePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  const handleAddColumn = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Use the comprehensive method that tries multiple approaches
      const result = await addCostPerHourColumn();
      setResult(result);

      // If failed, show the manual instructions section
      if (!result.success) {
        setShowManualInstructions(true);
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      });
      setShowManualInstructions(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSQL = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Attempt to run the SQL directly with IF NOT EXISTS for safety
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE employees ADD COLUMN IF NOT EXISTS cost_per_hour NUMERIC DEFAULT 0 NOT NULL;
          COMMENT ON COLUMN employees.cost_per_hour IS 'Hourly cost rate for the employee';
        `
      });

      if (error) {
        console.error('Error executing SQL:', error);
        setResult({ success: false, message: `Error: ${error.message}` });
        setShowManualInstructions(true);
      } else {
        setResult({ success: true, message: 'SQL executed successfully' });
      }
    } catch (error) {
      console.error('Exception executing SQL:', error);
      setResult({
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      });
      setShowManualInstructions(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdgeFunction = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Try using Supabase Edge Function if available
      const { data, error } = await supabase.functions.invoke('update-employee-schema', {
        body: { operation: 'add_cost_column' }
      });

      if (error) {
        console.error('Error with Edge Function:', error);
        setResult({
          success: false,
          message: `Edge Function Error: ${error.message}. The function may not be deployed.`
        });
        setShowManualInstructions(true);
      } else if (data?.success) {
        setResult({
          success: true,
          message: data.message || 'Successfully added column via Edge Function'
        });
      } else {
        setResult({
          success: false,
          message: data?.message || 'Edge Function did not return success'
        });
        setShowManualInstructions(true);
      }
    } catch (error) {
      console.error('Exception with Edge Function:', error);
      setResult({
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      });
      setShowManualInstructions(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-dark-800 rounded-lg shadow-sm p-6 border border-dark-700">
        <h1 className="text-2xl font-semibold text-dark-50 mb-6">Database Schema Update</h1>

        <div className="space-y-6">
          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-medium text-blue-200 mb-2">Employee Cost Per Hour Feature</h2>
            <p className="text-blue-100 mb-2">
              This utility will add the cost_per_hour column to the employees table in your database.
              This is required to store and track employee hourly cost rates.
            </p>
            <p className="text-blue-100 text-sm">
              This operation is safe and will not affect existing data. The column will be added with a default value of 0.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              onClick={handleAddColumn}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Processing...' : 'Add Cost Per Hour Column'}
            </button>

            <div className="flex items-center gap-2 text-dark-300 text-sm mt-2">
              <input
                type="checkbox"
                id="showAdvanced"
                checked={showAdvanced}
                onChange={() => setShowAdvanced(!showAdvanced)}
              />
              <label htmlFor="showAdvanced">Show advanced options</label>
            </div>

            {showAdvanced && (
              <div className="border-t border-dark-600 pt-4 mt-4 space-y-4">
                <h3 className="text-md font-medium text-dark-200">Advanced Options</h3>
                <p className="text-dark-300 text-sm mb-3">
                  These options try alternative methods if the primary method fails.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleDirectSQL}
                    disabled={loading}
                    className="px-4 py-2 bg-dark-700 text-dark-200 border border-dark-600 rounded-lg hover:bg-dark-600 disabled:opacity-50 w-full"
                  >
                    Try Direct SQL Execution
                  </button>

                  <button
                    onClick={handleEdgeFunction}
                    disabled={loading}
                    className="px-4 py-2 bg-dark-700 text-dark-200 border border-dark-600 rounded-lg hover:bg-dark-600 disabled:opacity-50 w-full"
                  >
                    Try Edge Function
                  </button>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setShowManualInstructions(!showManualInstructions)}
                    className="text-blue-400 text-sm hover:underline flex items-center"
                  >
                    {showManualInstructions ? 'Hide' : 'Show'} Manual SQL Instructions
                  </button>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-900/50 border border-green-700 text-green-100' : 'bg-red-900/50 border border-red-700 text-red-200'}`}>
              <h3 className="font-medium mb-1">{result.success ? 'Success!' : 'Error'}</h3>
              <p>{result.message}</p>

              {result.success && (
                <p className="mt-2 text-green-200 text-sm">
                  You can now use the Cost Per Hour field in the Organization page to set and track employee costs.
                </p>
              )}
            </div>
          )}

          {(showManualInstructions || (result && !result.success)) && (
            <div className="mt-6 p-4 bg-dark-700 border border-dark-600 rounded-lg">
              <h3 className="text-lg font-medium text-dark-100 mb-3">Manual SQL Instructions</h3>
              <p className="text-dark-300 mb-3 text-sm">
                If all automated methods fail, please run these SQL commands manually in the Supabase SQL Editor:
              </p>
              <pre className="p-3 bg-dark-900 rounded overflow-x-auto text-xs text-dark-200 whitespace-pre-wrap">
                {manualMigrationInstructions}
              </pre>

              <div className="mt-4 text-dark-300 text-sm">
                <h4 className="font-medium text-dark-200 mb-1">How to run this SQL manually:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Log in to your Supabase dashboard</li>
                  <li>Go to the SQL Editor</li>
                  <li>Create a new query</li>
                  <li>Paste the SQL commands above</li>
                  <li>Click "Run" to execute the query</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaUpdatePage;