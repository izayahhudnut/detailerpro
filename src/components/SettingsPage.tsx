import React from 'react';
import { Settings, Database, ArrowRight } from 'lucide-react';

interface SettingsPageProps {
  setCurrentPage?: (page: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ setCurrentPage }) => {
  // Determine if user is admin (in a real app, this would be from auth context)
  const isAdmin = true; // For demo purposes, everyone is an admin

  const handleNavigateToSchemaUpdate = () => {
    if (setCurrentPage) {
      setCurrentPage('schema-update');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl text-dark-50 mb-6">Settings</h1>

      <div className="max-w-3xl space-y-6">
        <div className="bg-dark-800 rounded-lg shadow border border-dark-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-dark-100 mb-6">Application Settings</h2>

            <div className="space-y-6">
              {/* Notifications Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-dark-100">Notifications</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <span className="text-dark-200">Email notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <span className="text-dark-200">SMS notifications</span>
                  </label>
                </div>
              </div>

              {/* Preferences Section */}
              <div className="pt-6 border-t border-dark-700">
                <h3 className="text-lg font-medium text-dark-100">Preferences</h3>
                <div className="space-y-4 mt-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <span className="text-dark-200">Show completed tasks</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <span className="text-dark-200">Auto-archive completed jobs</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <div className="bg-dark-800 rounded-lg shadow border border-dark-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-dark-100 mb-6">Admin Tools</h2>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-dark-100">Database Management</h3>

                <div className="border border-dark-700 rounded-lg p-4 hover:bg-dark-750">
                  <button
                    onClick={handleNavigateToSchemaUpdate}
                    className="w-full flex items-start justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Database size={20} className="text-blue-500" />
                      <div>
                        <h4 className="text-dark-100 font-medium">Schema Update Tool</h4>
                        <p className="text-dark-300 text-sm mt-1">
                          Add support for employee cost tracking and other database enhancements
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-dark-400 mt-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;