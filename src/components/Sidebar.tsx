import React from 'react';
// Logo import: place your logo file at src/assets/logo.png
import logo from '../assets/logo.png';
import { Calendar, Users, Building2, Settings, Plus, ListTodo, Package, Receipt } from 'lucide-react';

type SidebarProps = {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onCreateClick: () => void;
};

const Sidebar = ({ currentPage, setCurrentPage, onCreateClick }: SidebarProps) => {
  const navItems = [
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks' },
    { id: 'clients', icon: Users, label: 'Clients' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'invoicing', icon: Receipt, label: 'Invoicing' },
    { id: 'organization', icon: Building2, label: 'Organization' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="w-64 bg-dark-800 p-4 border-r border-dark-700">
      {/* App logo and name */}
      <div className="flex items-center mb-4">
        <img src={logo} alt="Detailer Pro" className="h-8 w-auto mr-2 opacity-50" />
        <span className="text-xl text-dark-50 opacity-50">Detailer Pro</span>
      </div>
      <button
        onClick={onCreateClick}
        className="w-full bg-blue-600 text-dark-50 rounded-lg p-3 flex items-center justify-center gap-2 mb-4 hover:bg-blue-700 transition-colors"
      >
        <Plus size={20} />
        <span>Create Job</span>
      </button>
      
      <nav className="space-y-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setCurrentPage(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === id
                ? 'bg-dark-700 text-white'
                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
            }`}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;