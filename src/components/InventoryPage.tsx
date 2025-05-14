import React, { useState, useEffect } from 'react';
import { Package, PenTool as Tool, AlertTriangle, Plus, Search, MapPin, Clock, Filter, BarChart4, DollarSign, ShoppingCart, Trash2, Edit2, X, Plane, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateInventoryQuantity, getJobInventoryUsage } from '../lib/data';
import type { InventoryItem, JobInventoryUsage, MaintenanceJob } from '../lib/data';
import CostAnalysisTab from './CostAnalysisTab';

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
}

interface RestockModalProps {
  onClose: () => void;
  item: InventoryItem;
  onRestock: (id: string, newQuantity: number) => Promise<void>;
}

interface EditItemModalProps {
  onClose: () => void;
  item: InventoryItem;
  onEdit: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
}

interface DeleteConfirmModalProps {
  onClose: () => void;
  item: InventoryItem;
  onDelete: (id: string) => Promise<void>;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    type: 'tool',
    description: '',
    quantity: 0,
    minimum_stock: 5,
    unit: '',
    location: '',
    cost_per_unit: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onAdd(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'minimum_stock' || name === 'cost_per_unit'
        ? parseFloat(value)
        : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">Add Inventory Item</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
            >
              <option value="tool">Tool</option>
              <option value="product">Product</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Initial Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                name="minimum_stock"
                value={formData.minimum_stock}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g., pcs, liters, kg"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Cost Per Unit ($)
              </label>
              <input
                type="number"
                name="cost_per_unit"
                value={formData.cost_per_unit}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Storage Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Warehouse A, Shelf B3"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditItemModal: React.FC<EditItemModalProps> = ({ onClose, item, onEdit }) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: item.name,
    type: item.type,
    description: item.description,
    minimum_stock: item.minimum_stock,
    unit: item.unit,
    location: item.location,
    cost_per_unit: item.cost_per_unit
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onEdit(item.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'minimum_stock' || name === 'cost_per_unit'
        ? parseFloat(value)
        : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">Edit {item.name}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
            >
              <option value="tool">Tool</option>
              <option value="product">Product</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Current Quantity (Read-only)
              </label>
              <input
                type="number"
                value={item.quantity}
                readOnly
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-400"
              />
              <p className="mt-1 text-xs text-dark-400">
                Use the Restock feature to modify quantity
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                name="minimum_stock"
                value={formData.minimum_stock}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g., pcs, liters, kg"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Cost Per Unit ($)
              </label>
              <input
                type="number"
                name="cost_per_unit"
                value={formData.cost_per_unit}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Storage Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Warehouse A, Shelf B3"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ onClose, item, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await onDelete(item.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 border border-dark-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-dark-50">Delete Inventory Item</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <p className="text-dark-200 mb-6">
          Are you sure you want to delete <span className="font-semibold text-dark-50">{item.name}</span>? This action cannot be undone.
        </p>

        {item.quantity > 0 && (
          <div className="mb-6 bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded">
            Warning: This item still has {item.quantity} {item.unit} in stock.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-dark-50 rounded-lg hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RestockModal: React.FC<RestockModalProps> = ({ onClose, item, onRestock }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [additionalQuantity, setAdditionalQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newTotal = item.quantity + additionalQuantity;
      if (newTotal < 0) {
        throw new Error('Total quantity cannot be negative');
      }
      await onRestock(item.id, newTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restock item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">Restock {item.name}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Current Quantity
            </label>
            <input
              type="number"
              value={item.quantity}
              disabled
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-400"
            />
            <p className="mt-1 text-xs text-dark-400">
              Minimum stock level: {item.minimum_stock} {item.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Add Quantity
            </label>
            <input
              type="number"
              value={additionalQuantity}
              onChange={(e) => setAdditionalQuantity(parseInt(e.target.value) || 0)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              min="1"
              required
            />
            <p className="mt-1 text-xs text-dark-400">
              Enter how many {item.unit} to add to inventory
            </p>
          </div>

          <div className="p-3 bg-dark-600 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-dark-200">New Total:</span>
              <span className="font-medium text-dark-50">
                {item.quantity + additionalQuantity} {item.unit}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              disabled={loading || additionalQuantity <= 0}
            >
              {loading ? 'Updating...' : 'Restock'}
              {!loading && <RefreshCw size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [usageSearchTerm, setUsageSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tool' | 'product'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'usage' | 'analysis'>('inventory');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*');

      if (error) throw error;
      setItems(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      setUsageLoading(true);
      const usageData = await getJobInventoryUsage();
      setUsageHistory(usageData);
      setUsageError(null);
    } catch (err) {
      console.error('Error fetching inventory usage history:', err);
      setUsageError('Failed to load usage history');
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchUsageHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'usage' && usageHistory.length === 0 && !usageLoading) {
      fetchUsageHistory();
    }
  }, [activeTab]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredUsageHistory = usageHistory.filter(usage => {
    const itemName = usage.item?.name || 'Unknown';
    const jobTitle = usage.job?.title || 'Unknown';
    const employeeName = usage.job?.employee?.name || 'Unknown';
    const employeeSpecialization = usage.job?.employee?.specialization || '';

    return (
      itemName.toLowerCase().includes(usageSearchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(usageSearchTerm.toLowerCase()) ||
      employeeName.toLowerCase().includes(usageSearchTerm.toLowerCase()) ||
      employeeSpecialization.toLowerCase().includes(usageSearchTerm.toLowerCase())
    );
  });

  const getLowStockItems = () => {
    return filteredItems.filter(item => item.quantity <= item.minimum_stock);
  };

  const handleAddItem = async (itemData: Omit<InventoryItem, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;

      // Refresh the inventory list
      await fetchInventory();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding inventory item:', err);
      throw err;
    }
  };

  const handleRestock = async (id: string, newQuantity: number) => {
    try {
      const updatedItem = await updateInventoryQuantity(id, newQuantity);
      if (!updatedItem) throw new Error('Failed to update inventory quantity');

      // Refresh the inventory list
      await fetchInventory();
      setShowRestockModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error restocking inventory item:', err);
      throw err;
    }
  };

  const handleEditItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update inventory item');

      // Refresh the inventory list
      await fetchInventory();
      setShowEditModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw err;
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      // First check if the item is used in any jobs to prevent data integrity issues
      const { data: usageData, error: usageError } = await supabase
        .from('job_inventory')
        .select('id')
        .eq('item_id', id)
        .limit(1);

      if (usageError) throw usageError;

      // If the item is used in jobs, prevent deletion
      if (usageData && usageData.length > 0) {
        throw new Error('Cannot delete this item as it is used in one or more jobs. Consider marking it as inactive instead.');
      }

      // Proceed with deletion if there's no usage
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the inventory list
      await fetchInventory();
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-32 bg-dark-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-dark-50">Inventory Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-dark-50 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-dark-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-dark-300 hover:text-dark-100 hover:border-dark-300'
              }`}
            >
              Inventory Items
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'usage'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-dark-300 hover:text-dark-100 hover:border-dark-300'
              }`}
            >
              Usage Tracking
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-dark-300 hover:text-dark-100 hover:border-dark-300'
              }`}
            >
              Cost Analysis
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'inventory' && (
        <div className="bg-dark-800 rounded-lg shadow-sm p-6 border border-dark-700">
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-50"
              >
                <option value="all">All Items</option>
                <option value="tool">Tools</option>
                <option value="product">Products</option>
              </select>
            </div>

            {getLowStockItems().length > 0 && (
              <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-100 mb-2">
                  <AlertTriangle size={20} />
                  <h3 className="font-medium">Low Stock Alert</h3>
                </div>
                <div className="space-y-2">
                  {getLowStockItems().map(item => (
                    <div key={item.id} className="flex justify-between items-center text-yellow-200">
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} {item.unit} remaining (min: {item.minimum_stock})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="border border-dark-600 rounded-lg p-4 bg-dark-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {item.type === 'tool' ? (
                      <Tool className="text-blue-400" size={24} />
                    ) : (
                      <Package className="text-green-400" size={24} />
                    )}
                    <div>
                      <h3 className="font-medium text-dark-50">{item.name}</h3>
                      <p className="text-sm text-dark-200">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      item.quantity <= item.minimum_stock ? 'text-red-400' : 'text-dark-50'
                    }`}>
                      {item.quantity} {item.unit}
                    </div>
                    <div className="text-sm text-dark-300">
                      Min: {item.minimum_stock} {item.unit}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-dark-300 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      Last restocked: {new Date(item.last_restocked || '').toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-dark-200">
                      ${item.cost_per_unit.toFixed(2)} / {item.unit}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowRestockModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-1 rounded-md hover:bg-dark-600"
                        title="Restock"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowEditModal(true);
                        }}
                        className="text-green-400 hover:text-green-300 p-1 rounded-md hover:bg-dark-600"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-dark-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 &&
              <div className="text-center py-8 text-dark-300">
                No items found
              </div>
            }
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="bg-dark-800 rounded-lg shadow-sm p-6 border border-dark-700">
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                <input
                  type="text"
                  placeholder="Search usage history (item name, job title, employee)"
                  value={usageSearchTerm}
                  onChange={(e) => setUsageSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50"
                />
              </div>
              <button
                onClick={fetchUsageHistory}
                className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-200 hover:bg-dark-600 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {usageLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-24 bg-dark-700 rounded-lg"></div>
              ))}
            </div>
          ) : usageError ? (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
              {usageError}
            </div>
          ) : (
            <div>
              <div className="border-b border-dark-600 pb-2 mb-4 grid grid-cols-5 text-dark-300 text-sm">
                <div className="font-medium">Item</div>
                <div className="font-medium">Quantity</div>
                <div className="font-medium">Job</div>
                <div className="font-medium">Employee</div>
                <div className="font-medium">Date</div>
              </div>

              <div className="space-y-3">
                {filteredUsageHistory.length > 0 ? (
                  filteredUsageHistory.map(usage => (
                    <div
                      key={usage.id}
                      className="grid grid-cols-5 bg-dark-700 p-3 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-dark-50">{usage.item?.name || 'Unknown Item'}</p>
                        <p className="text-xs text-dark-300">${usage.cost_at_time?.toFixed(2) || '0.00'} per {usage.item?.unit || 'unit'}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-dark-100">{usage.quantity_used} {usage.item?.unit || 'units'}</span>
                      </div>
                      <div>
                        <p className="text-dark-100">{usage.job?.title || 'Unknown Job'}</p>
                      </div>
                      <div>
                        <p className="text-dark-100">{usage.job?.employee?.name || 'Unknown'}</p>
                        <p className="text-xs text-dark-300">{usage.job?.employee?.specialization || ''}</p>
                      </div>
                      <div>
                        <p className="text-dark-100">{new Date(usage.used_at || usage.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-dark-300">{new Date(usage.used_at || usage.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-dark-300">
                    No usage history found
                  </div>
                )}
              </div>

              {filteredUsageHistory.length > 0 && (
                <div className="mt-6 p-4 bg-dark-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-dark-300 text-sm">Total Items Used</p>
                      <p className="text-xl font-medium text-dark-50">{filteredUsageHistory.reduce((sum, usage) => sum + usage.quantity_used, 0)}</p>
                    </div>
                    <div>
                      <p className="text-dark-300 text-sm">Total Cost</p>
                      <p className="text-xl font-medium text-dark-50">
                        ${filteredUsageHistory.reduce((sum, usage) => sum + (usage.quantity_used * usage.cost_at_time), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="bg-dark-800 rounded-lg shadow-sm p-6 border border-dark-700">
          <CostAnalysisTab />
        </div>
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}

      {showRestockModal && selectedItem && (
        <RestockModal
          onClose={() => {
            setShowRestockModal(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onRestock={handleRestock}
        />
      )}

      {showEditModal && selectedItem && (
        <EditItemModal
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onEdit={handleEditItem}
        />
      )}

      {showDeleteModal && selectedItem && (
        <DeleteConfirmModal
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
};

export default InventoryPage;