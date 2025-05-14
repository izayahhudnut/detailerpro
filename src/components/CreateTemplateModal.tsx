import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { addProgressTemplate } from '../lib/data';
import type { ProgressTemplate, ProgressStep } from '../lib/data';

interface CreateTemplateModalProps {
  onClose: () => void;
  onTemplateCreated: () => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ onClose, onTemplateCreated }) => {
  const [formData, setFormData] = useState<Omit<ProgressTemplate, 'id'>>({
    name: '',
    description: '',
    steps: []
  });

  const [newStep, setNewStep] = useState<Partial<ProgressStep>>({
    title: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewStep(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addStep = () => {
    if (!newStep.title) return;

    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: crypto.randomUUID(),
          template_id: '',
          title: newStep.title,
          description: newStep.description || null,
          order_number: prev.steps.length + 1
        }
      ]
    }));

    setNewStep({
      title: '',
      description: ''
    });
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({
          ...step,
          order_number: i + 1
        }))
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.steps.length === 0) {
      alert('Please add at least one step to the template');
      return;
    }

    try {
      addProgressTemplate(formData);
      onTemplateCreated();
      onClose();
    } catch (err) {
      console.error('Error creating template:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">Create Progress Template</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Template Name
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
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-50"
              rows={3}
            />
          </div>

          <div className="border-t border-dark-700 pt-6">
            <h3 className="text-lg font-medium text-dark-100 mb-4">Progress Steps</h3>
            
            <div className="space-y-4 mb-6">
              {formData.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-3 p-4 bg-dark-700 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center font-medium">
                    {step.order_number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-dark-50">{step.title}</h4>
                        {step.description && (
                          <p className="text-sm text-dark-300">{step.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 bg-dark-700 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Step Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newStep.title}
                  onChange={handleStepChange}
                  className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-dark-50"
                  placeholder="Enter step title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Step Description
                </label>
                <textarea
                  name="description"
                  value={newStep.description || ''}
                  onChange={handleStepChange}
                  className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-dark-50"
                  rows={2}
                  placeholder="Enter step description (optional)"
                />
              </div>

              <button
                type="button"
                onClick={addStep}
                className="w-full px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Step
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 border-t border-dark-700 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700"
            >
              Create Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;