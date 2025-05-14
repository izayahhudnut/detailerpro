import React, { useState, useEffect } from 'react';
import { X, Edit2, Package, Plus, Search, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { MaintenanceJob, Todo, ProgressTemplate, getProgressTemplate, getInventoryItems, addInventoryUsage, toggleTodo, updateInventoryQuantity } from '../lib/data';
import type { InventoryItem, JobInventoryUsage } from '../lib/data';
import { useNavigate } from 'react-router-dom';

interface TaskModalProps {
  job: MaintenanceJob;
  onClose: () => void;
  onSave: (updatedJob: MaintenanceJob) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ job, onClose, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(job);
  const [template, setTemplate] = useState<ProgressTemplate | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Local state for client notification phone and progress completion
  const [notificationPhone, setNotificationPhone] = useState(job.notification_phone || '');
  const [completedStepsMap, setCompletedStepsMap] = useState<Record<string, boolean>>({});
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, string>>({});
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('TaskModal mounted with job:', job);
    console.log('Inventory usage on job:', job.inventory_usage);

    let isMounted = true;
    async function loadTemplate() {
      if (!job.template_id) return;
      try {
        console.log('Loading template with ID:', job.template_id);
        console.log('Current job todos:', job.todos);

        const templateData = await getProgressTemplate(job.template_id);
        if (isMounted && templateData) {
          setTemplate(templateData);
          if (templateData.steps && templateData.steps.length > 0) {
            // Initialize completed steps map from job.todos
            const initialMap: Record<string, boolean> = {};
            templateData.steps.forEach(step => {
              const isCompleted = job.todos?.some(todo => todo.step_id === step.id && todo.completed) || false;
              initialMap[step.id] = isCompleted;
              console.log(`Step ${step.id}: ${step.title} - Completed: ${isCompleted}`);
            });
            setCompletedStepsMap(initialMap);

            const completedSteps = templateData.steps.filter(step =>
              job.todos?.some(todo => todo.step_id === step.id && todo.completed)
            ).length;
            const progressValue = (completedSteps / templateData.steps.length) * 100;
            console.log(`Progress calculation: ${completedSteps}/${templateData.steps.length} = ${progressValue}%`);
            setProgress(progressValue);
          } else {
            setProgress(0);
          }
        }
      } catch (err) {
        console.error('Error loading progress template:', err);
      }
    }

    async function loadInventory() {
      try {
        // Load all inventory items
        const items = await getInventoryItems();
        setInventoryItems(items);
        console.log('Loaded inventory items:', items);

        // Always try to fetch inventory usage to ensure we have the latest data
        console.log('Fetching inventory usage for job:', job.id);
        // Import supabase
        const { supabase } = await import('../lib/supabase');

        const { data: jobInventory, error: invError } = await supabase
          .from('job_inventory')
          .select('*, item:inventory(id, name, unit, quantity, minimum_stock, cost_per_unit)')
          .eq('job_id', job.id);

        if (invError) {
          console.error('Error fetching job inventory:', invError);
        }

        if (jobInventory && jobInventory.length > 0) {
          console.log('Found job inventory items in database:', jobInventory);

          // Update job with inventory data we found
          const updatedJob = {
            ...job,
            inventory_usage: jobInventory
          };
          console.log('Updating job with inventory usage:', updatedJob);
          onSave(updatedJob);
        } else {
          console.log('No inventory usage found in database for job:', job.id);
        }
      } catch (err) {
        console.error('Error loading inventory data:', err);
      }
    }

    loadTemplate();
    loadInventory(); // Load inventory when modal opens

    return () => { isMounted = false; };
  }, [job]);
  // Initialize local completed steps map from database
  // We'll rely on the job.todos state rather than localStorage
  // This effect is now handled in the loadTemplate function

  useEffect(() => {
    // Refresh inventory items when inventory modal is opened
    if (showInventoryModal) {
      const loadInventoryItems = async () => {
        try {
          const items = await getInventoryItems();
          setInventoryItems(items);
        } catch (err) {
          console.error('Error loading inventory items:', err);
          setInventoryItems([]);
        }
      };

      loadInventoryItems();
    }
  }, [showInventoryModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Show invoice prompt when status is changed to 'done'
    if (name === 'status' && value === 'done') {
      setShowInvoicePrompt(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setEditing(false);
  };

  // Toggle a progress step and save to localStorage directly (no database dependency)
  const handleStepToggle = async (stepId: string, completed: boolean) => {
    try {
      console.log(`Toggle step ${stepId} to ${completed}`);

      // Update local state immediately for responsive UI
      setCompletedStepsMap(prev => {
        const next = { ...prev, [stepId]: completed };
        if (template) {
          const total = template.steps.length;
          const done = Object.values(next).filter(Boolean).length;
          const newProgress = (done / total) * 100;
          console.log(`Updating progress: ${done}/${total} = ${newProgress}%`);
          setProgress(newProgress);
        }
        return next;
      });

      // Create todo object without database dependency
      const now = completed ? new Date().toISOString() : null;
      const todoId = `${job.id}_${stepId}`;
      const todo = {
        id: todoId,
        job_id: job.id,
        step_id: stepId,
        description: '',
        completed,
        completed_at: now
      };

      // Store in localStorage
      const storageKey = `todo_${job.id}_${stepId}`;
      localStorage.setItem(storageKey, JSON.stringify(todo));
      console.log('Saved todo to localStorage:', todo);

      // Update job with new todo data for parent component
      const updatedTodos = job.todos ?
        job.todos.filter(t => t.step_id !== stepId).concat(todo) :
        [todo];

      // Log the todos before and after update
      console.log('Original todos:', job.todos);
      console.log('Updated todos:', updatedTodos);

      // Update parent component with new job state
      const updatedJob = {
        ...job,
        todos: updatedTodos
      };
      console.log('Saving updated job:', updatedJob);
      onSave(updatedJob);

    } catch (err) {
      console.error('Error toggling todo:', err);
      // Revert local state on error
      setCompletedStepsMap(prev => ({
        ...prev,
        [stepId]: !completed
      }));
    }
  };


  const handleAddInventoryItem = async (item: InventoryItem, quantity: number) => {
    if (quantity > 0 && quantity <= item.quantity) {
      try {
        // Add inventory usage to the job - this will also update the inventory quantity
        const usage = await addInventoryUsage({
          job_id: job.id,
          item_id: item.id,
          quantity_used: quantity,
          cost_at_time: item.cost_per_unit
        });

        // Refresh inventory items after updating
        const items = await getInventoryItems();
        setInventoryItems(items);

        // Update the job with the new usage
        const updatedJob = {
          ...job,
          inventory_usage: [...(job.inventory_usage || []), {
            ...usage,
            item: item
          }]
        };

        console.log('Updating job with new inventory usage:', updatedJob);
        onSave(updatedJob);

        // Reset quantity input
        setSelectedQuantities(prev => ({
          ...prev,
          [item.id]: ''
        }));

        // Show success message
        setError(`Added ${quantity} ${item.unit} of ${item.name} to the task`);

        // Close the inventory modal
        setShowInventoryModal(false);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setError(null);
        }, 3000);
      } catch (err) {
        console.error('Error adding inventory item:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to add inventory item. Please try again.');
        }
      }
    } else {
      setError('Invalid quantity. Please ensure the quantity is greater than 0 and does not exceed available stock.');
    }
  };

  const handleCreateInvoice = () => {
    navigate('/invoicing', { state: { jobId: job.id } });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="text-xl font-semibold bg-dark-700 border border-dark-600 rounded px-2 py-1 w-full text-dark-50"
              />
            ) : (
              <h2 className="text-xl font-semibold text-dark-50">{job.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="text-blue-400 hover:text-blue-300"
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-dark-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className={`mb-4 ${error.includes('success') ? 'bg-green-900/50 border border-green-700 text-green-100' : 'bg-red-900/50 border border-red-700 text-red-200'} px-4 py-3 rounded`}>
            {error}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time.slice(0, 16)}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="qa">Quality Assurance</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Notification Phone Number
              </label>
              <input
                type="tel"
                name="notification_phone"
                value={formData.notification_phone || ''}
                onChange={handleChange}
                placeholder="+1 (555) 555-5555"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              />
              <p className="mt-1 text-sm text-dark-300">
                Enter a phone number to receive progress updates via SMS
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <p className="text-dark-200">{job.description}</p>

            {template && template.steps && template.steps.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-dark-100">Progress</h3>
                  <span className="text-sm font-medium text-dark-200">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="space-y-3">
                  {template.steps.map(step => {
                    const completed = completedStepsMap[step.id] || false;
                    return (
                      <div key={step.id} className="flex items-start gap-3 p-3 bg-dark-700 rounded-lg">
                        <input
                          type="checkbox"
                          checked={completed}
                          onChange={(e) => handleStepToggle(step.id, e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded bg-dark-600 border-dark-500"
                        />
                        <div>
                          <p className={`font-medium text-dark-100 ${completed ? 'line-through text-dark-400' : ''}`}>
                            {step.title}
                          </p>
                          {step.description && (
                            <p className="text-sm text-dark-300">{step.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom client notification UI removed */}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-dark-100 flex items-center gap-2">
                  <Package size={18} />
                  Inventory Usage
                </h3>
                <button
                  onClick={() => setShowInventoryModal(true)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Add Items
                </button>
              </div>

              {job.inventory_usage && job.inventory_usage.length > 0 ? (
                <div className="space-y-3">
                  {job.inventory_usage.map((usage, index) => {
                    // Try to find the item information
                    let displayItem = usage.item;

                    // If item is missing or doesn't have needed properties, try to find it in inventoryItems
                    if (!displayItem || !displayItem.name) {
                      displayItem = inventoryItems.find(i => i.id === usage.item_id);
                    }

                    console.log(`Rendering inventory usage ${index}:`, usage);
                    console.log(`Item ID: ${usage.item_id}, Item data:`, usage.item);
                    if (displayItem) console.log(`Found item:`, displayItem);
                    else console.log(`Could not find item for usage:`, usage, `in inventory items:`, inventoryItems);

                    const itemName = displayItem?.name || 'Unknown Item';
                    const itemUnit = displayItem?.unit || 'units';
                    const itemQuantity = displayItem?.quantity || 0;
                    const itemMinStock = displayItem?.minimum_stock || 0;
                    const costAtTime = usage.cost_at_time || 0;

                    return (
                      <div key={usage.id || index} className="flex justify-between items-center p-3 bg-dark-700 rounded-lg">
                        <div>
                          <p className="font-medium text-dark-100">
                            {itemName}
                          </p>
                          <p className="text-sm text-dark-300">
                            {usage.quantity_used} {itemUnit} @ ${costAtTime.toFixed(2)} each
                          </p>
                          {displayItem && (
                            <p className="text-xs text-dark-400 mt-1">
                              Current stock: {itemQuantity} {itemUnit}
                              {itemQuantity <= itemMinStock && (
                                <span className="ml-2 text-red-400">
                                  (Low stock)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-dark-100">
                            ${(usage.quantity_used * costAtTime).toFixed(2)}
                          </p>
                          <p className="text-xs text-dark-400">
                            Used on {new Date(usage.used_at || Date.now()).toLocaleDateString()}
                            at {new Date(usage.used_at || Date.now()).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-between items-center pt-3 border-t border-dark-600">
                    <span className="text-dark-200">Total Cost</span>
                    <span className="font-medium text-dark-50">
                      ${job.inventory_usage.reduce((sum, usage) => sum + (usage.quantity_used * usage.cost_at_time), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-dark-300 py-4">No inventory items used</p>
              )}
            </div>

            <div className="bg-dark-700 p-4 rounded-lg space-y-2">
              <p className="font-medium text-dark-100">Schedule Details</p>
              <p className="text-sm text-dark-200">
                Start: {new Date(job.start_time).toLocaleString()}
              </p>
              <p className="text-sm text-dark-200">Duration: {job.duration} hours</p>
            </div>
            
            <div className="bg-dark-700 p-4 rounded-lg space-y-2">
              <p className="font-medium text-dark-100">Vehicle</p>
              <p className="text-sm text-dark-200">
                {job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.registration})
              </p>
            </div>
            
            <div className="bg-dark-700 p-4 rounded-lg space-y-2">
              <p className="font-medium text-dark-100">Assigned To</p>
              <p className="text-sm text-dark-200">
                {job.employee?.name} - {job.employee?.specialization}
              </p>
            </div>
            
            <div className="bg-dark-700 p-4 rounded-lg space-y-2">
              <p className="font-medium text-dark-100">Client</p>
              <p className="text-sm text-dark-200">
                {job.vehicle?.client?.first_name} {job.vehicle?.client?.last_name}
              </p>
            </div>

            <div className="mt-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                job.status === 'done' ? 'bg-green-900/50 text-green-100' :
                job.status === 'qa' ? 'bg-purple-900/50 text-purple-100' :
                job.status === 'in-progress' ? 'bg-yellow-900/50 text-yellow-100' :
                'bg-blue-900/50 text-blue-100'
              }`}>
                {job.status.replace('-', ' ')}
              </span>
            </div>
            {/* Save button for progress */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  // Save the current progress for the task
                  onSave({
                    ...job,
                    notification_phone: notificationPhone || job.notification_phone,
                    // Pass along any other updated properties
                  });
                  // Close the modal
                  onClose();
                  // Reload the page to refresh the progress bar
                  window.location.reload();
                }}
                className="w-full px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Clock size={18} />
                Save
              </button>
            </div>
          </div>
        )}

        {showInvoicePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full border border-dark-700">
              <h3 className="text-xl font-semibold text-dark-50 mb-4">Job Completed</h3>
              <p className="text-dark-200 mb-6">Would you like to create an invoice for this job now?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowInvoicePrompt(false)}
                  className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
                >
                  Later
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {showInventoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-dark-50">Add Inventory Items</h2>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="text-dark-400 hover:text-dark-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50"
                  />
                </div>

                <div className="space-y-3">
                  {inventoryItems
                    .filter(item => 
                      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                      item.description?.toLowerCase().includes(inventorySearch.toLowerCase())
                    )
                    .map(item => (
                      <div key={item.id} className="p-4 bg-dark-700 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-dark-50">{item.name}</h3>
                            <p className="text-sm text-dark-300">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${item.quantity <= item.minimum_stock ? 'text-red-400' : 'text-dark-100'}`}>
                              {item.quantity} {item.unit} available
                            </p>
                            <p className="text-sm text-dark-300">
                              ${item.cost_per_unit.toFixed(2)} per {item.unit}
                            </p>
                          </div>
                        </div>

                        {item.quantity === 0 ? (
                          <div className="mt-3 p-2 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-300">
                            <AlertTriangle size={16} />
                            <span className="text-sm">Out of stock</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 mt-3">
                            <input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={selectedQuantities[item.id] || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (isNaN(val) || val <= item.quantity) {
                                  setSelectedQuantities(prev => ({
                                    ...prev,
                                    [item.id]: e.target.value
                                  }));
                                }
                              }}
                              className="w-24 bg-dark-600 border border-dark-500 rounded px-3 py-1 text-dark-50"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const quantity = parseInt(selectedQuantities[item.id] || '0');
                                handleAddInventoryItem(item, quantity);
                              }}
                              disabled={
                                !selectedQuantities[item.id] ||
                                parseInt(selectedQuantities[item.id]) < 1 ||
                                parseInt(selectedQuantities[item.id]) > item.quantity
                              }
                              className="px-4 py-2 bg-blue-600 text-dark-50 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        )}

                        {selectedQuantities[item.id] && parseInt(selectedQuantities[item.id]) > item.quantity && (
                          <div className="mt-2 text-xs text-red-400">
                            Cannot exceed available quantity ({item.quantity} {item.unit})
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;