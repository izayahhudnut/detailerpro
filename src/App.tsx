import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MaintenanceCalendar from './components/MaintenanceCalendar';
import Sidebar from './components/Sidebar';
import ClientPage from './components/ClientPage';
import OrganizationPage from './components/OrganizationPage';
import SettingsPage from './components/SettingsPage';
import CreateJobModal from './components/CreateJobModal';
import TasksPage from './components/TasksPage';
import InventoryPage from './components/InventoryPage';
import InvoicingPage from './components/InvoicingPage';
import SchemaUpdatePage from './components/SchemaUpdatePage';

type Page = 'calendar' | 'tasks' | 'clients' | 'organization' | 'settings' | 'inventory' | 'invoicing' | 'schema-update';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('calendar');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);

  const handleJobCreated = () => {
    setCalendarKey(prev => prev + 1);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'calendar':
        return <MaintenanceCalendar key={calendarKey} />;
      case 'tasks':
        return <TasksPage />;
      case 'clients':
        return <ClientPage />;
      case 'organization':
        return <OrganizationPage />;
      case 'settings':
        return <SettingsPage setCurrentPage={setCurrentPage} />;
      case 'inventory':
        return <InventoryPage />;
      case 'invoicing':
        return <InvoicingPage />;
      case 'schema-update':
        return <SchemaUpdatePage />;
      default:
        return <MaintenanceCalendar key={calendarKey} />;
    }
  };

  return (
    <Router>
      <div className="flex h-screen bg-dark-950 text-dark-50">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
        <main className="flex-1 overflow-auto bg-dark-950">
          {renderPage()}
        </main>
        {isCreateModalOpen && (
          <CreateJobModal 
            onClose={() => setIsCreateModalOpen(false)}
            onJobCreated={handleJobCreated}
          />
        )}
      </div>
    </Router>
  );
}

export default App;