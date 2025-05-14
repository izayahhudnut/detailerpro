import React, { useState, useEffect } from 'react';
import { MoreVertical, X, Edit2, Trash2, FileText, DollarSign, Plus, Archive } from 'lucide-react';
import { 
  MaintenanceJob,
  getMaintenanceJobs,
  updateMaintenanceJob,
  deleteMaintenanceJob,
  getProgressTemplate,
  JobInventoryUsage,
  Client,
} from '../lib/data';
import TaskModal from './TaskModal';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

interface TaskMenuProps {
  job: MaintenanceJob;
  onEdit: () => void;
  onDelete: () => void;
  onViewReport?: () => void;
  onArchive?: () => void;
}

const TaskMenu: React.FC<TaskMenuProps> = ({ job, onEdit, onDelete, onViewReport, onArchive }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-dark-400 hover:text-dark-200"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-lg z-20 py-1 border border-dark-700">
            {job.status === 'done' ? (
              <>
                <button
                  onClick={() => {
                    onViewReport?.();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-dark-100 hover:bg-dark-700 flex items-center gap-2"
                >
                  <FileText size={14} />
                  View Report
                </button>
                <button
                  onClick={() => {
                    onArchive?.();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-700 flex items-center gap-2"
                >
                  <Archive size={14} />
                  Archive
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onEdit();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-dark-100 hover:bg-dark-700 flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  View & Edit
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-700 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
// Modal to view a read-only report of a completed job
interface ReportModalProps {
  job: MaintenanceJob;
  onClose: () => void;
}
const ReportModal: React.FC<ReportModalProps> = ({ job, onClose }) => {
  const [inventoryUsage, setInventoryUsage] = useState<JobInventoryUsage[]>([]);
  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [crewDetails, setCrewDetails] = useState<CrewWithMembers | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: usageData } = await supabase
          .from('job_inventory')
          .select('quantity_used, cost_at_time, used_at, item:inventory(name, unit)')
          .eq('job_id', job.id);
        setInventoryUsage(usageData || []);
      } catch (err) {
        console.error('Error fetching inventory usage:', err);
      }

      try {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('id', job.vehicle.client.id)
          .single();
        setClientDetails(data);
      } catch (err) {
        console.error('Error fetching client details:', err);
      }

      // Fetch crew details if a crew is assigned
      if (job.crew_id) {
        try {
          const crewData = await getCrewWithMembers(job.crew_id);
          setCrewDetails(crewData);
        } catch (err) {
          console.error('Error fetching crew details:', err);
        }
      }
    }
    fetchData();
  }, [job.id, job.vehicle.client.id, job.crew_id]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 max-w-2xl w-full border border-dark-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-dark-800 pt-2 z-10">
          <h3 className="text-xl font-semibold text-dark-50">{job.vehicle.make} {job.vehicle.model} Report</h3>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200"> <X size={20} /> </button>
        </div>
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-4">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Job Report</h4>
          <div className="text-sm text-dark-200 space-y-1">
            <p>Title: {job.title}</p>
            <p>Description: {job.description}</p>
            <p>Start Time: {new Date(job.start_time).toLocaleString()}</p>
            <p>Duration: {job.duration} hours</p>
            <p>End Time: {new Date(new Date(job.start_time).getTime() + job.duration * 60 * 60 * 1000).toLocaleString()}</p>
            <p>Assigned to: {job.employee ? job.employee.name : job.crew ? `Crew: ${job.crew.name}` : 'Unassigned'}</p>
          </div>
        </section>
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-4">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Client Information</h4>
          <div className="text-sm text-dark-200 space-y-1">
            <p>Name: {job.vehicle.client.first_name} {job.vehicle.client.last_name}</p>
            {clientDetails && (
              <>
                <p>Email: {clientDetails.email}</p>
                <p>Address: {clientDetails.street}, {clientDetails.city}, {clientDetails.state} {clientDetails.zip_code}</p>
              </>
            )}
          </div>
        </section>

        {/* Labor and Crew Section */}
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-4">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Labor Information</h4>
          {job.employee ? (
            <div className="text-sm text-dark-200 space-y-1">
              <p>Employee: {job.employee.name}</p>
              <p>Specialization: {job.employee.specialization}</p>
              <p>Labor Rate: ${typeof job.employee.cost_per_hour === 'number' ? job.employee.cost_per_hour.toFixed(2) : '0.00'}/hour</p>
              <p>Hours worked: {job.duration} hours</p>
              <p className="font-medium text-dark-100">
                Total Labor Cost: ${((typeof job.employee.cost_per_hour === 'number' ? job.employee.cost_per_hour : 0) * job.duration).toFixed(2)}
              </p>
            </div>
          ) : job.crew && crewDetails ? (
            <div className="text-sm text-dark-200">
              <p>Crew: {crewDetails.name}</p>
              {crewDetails.description && <p>Description: {crewDetails.description}</p>}
              <p className="mt-2 font-medium">Crew Members:</p>
              <ul className="list-disc list-inside mb-3">
                {crewDetails.members.map(member => {
                  const hourlyRate = typeof member.employee?.cost_per_hour === 'number' ? member.employee.cost_per_hour : 0;
                  const memberCost = hourlyRate * job.duration;
                  return (
                    <li key={member.id}>
                      {member.employee?.name} - {member.is_leader ? 'Leader' : 'Member'} -
                      ${hourlyRate.toFixed(2)}/hour × {job.duration} hours = ${memberCost.toFixed(2)}
                    </li>
                  );
                })}
              </ul>
              {crewDetails.members.length > 0 && (
                <>
                  <p className="mt-2">Hours worked per crew member: {job.duration} hours</p>
                  {/* Calculate total crew cost based on members' hourly rates */}
                  <p className="font-medium text-dark-100 border-t border-dark-600 pt-2">
                    Total Crew Labor Cost: ${crewDetails.members.reduce((total, member) => {
                      return total + ((typeof member.employee?.cost_per_hour === 'number' ? member.employee.cost_per_hour : 0) * job.duration);
                    }, 0).toFixed(2)}
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-dark-300">No labor assigned.</p>
          )}
        </section>
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Inventory Used</h4>
          {inventoryUsage.length > 0 ? (
            <>
              <ul className="text-sm text-dark-200 list-disc list-inside max-h-40 overflow-y-auto mb-3">
                {inventoryUsage.map((u, i) => (
                  <li key={i}>
                    {u.item.name}: {u.quantity_used} {u.item.unit} @ ${u.cost_at_time.toFixed(2)} each = ${(u.quantity_used * u.cost_at_time).toFixed(2)} (at {new Date(u.used_at).toLocaleString()})
                  </li>
                ))}
              </ul>
              <div className="text-sm font-medium text-dark-100 border-t border-dark-600 pt-2">
                Total Material Cost: ${inventoryUsage.reduce((total, item) => total + (item.quantity_used * item.cost_at_time), 0).toFixed(2)}
              </div>
            </>
          ) : <p className="text-sm text-dark-300">No inventory used.</p>}
        </section>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>
  );
};

interface InvoicePromptProps {
  job: MaintenanceJob;
  onClose: () => void;
}

const InvoicePrompt: React.FC<InvoicePromptProps> = ({ job, onClose }) => {
  // Determine default hourly rate based on assigned employee or crew (if available)
  const getDefaultHourlyRate = () => {
    if (job.employee && job.employee.cost_per_hour !== undefined) {
      return job.employee.cost_per_hour.toString();
    }
    // Default fallback rate
    return '85';
  };

  const [invoiceData, setInvoiceData] = useState({
    hourlyRate: getDefaultHourlyRate(),
    additionalItems: [] as { description: string; amount: string }[],
    notes: job.description || ''
  });

  // Fetch inventory usage and client details for job report
  type InventoryUsageWithItem = {
    quantity_used: number;
    cost_at_time: number;
    used_at: string;
    item: {
      name: string;
      unit: string;
    };
  };
  type ClientDetails = {
    email: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsageWithItem[]>([]);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [crewDetails, setCrewDetails] = useState<CrewWithMembers | null>(null);
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);

  useEffect(() => {
    async function fetchReportData() {
      // fetch inventory usage
      try {
        const { data: usageData } = await supabase
          .from('job_inventory')
          .select('quantity_used, cost_at_time, used_at, item:inventory(name, unit)')
          .eq('job_id', job.id);
        setInventoryUsage(usageData || []);

        // Calculate total material cost
        if (usageData && usageData.length > 0) {
          const totalMaterialCost = usageData.reduce(
            (total, item) => total + (item.quantity_used * item.cost_at_time),
            0
          );
          setMaterialCost(totalMaterialCost);
        }
      } catch (error) {
        console.error('Error fetching inventory usage:', error);
      }

      // fetch client details
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('email, street, city, state, zip_code')
          .eq('id', job.vehicle.client.id)
          .single();
        setClientDetails(clientData || null);
      } catch (error) {
        console.error('Error fetching client details:', error);
      }

      // Fetch crew details if a crew is assigned
      if (job.crew_id) {
        try {
          const crewData = await getCrewWithMembers(job.crew_id);
          setCrewDetails(crewData);

          // Calculate crew labor cost
          if (crewData && crewData.members.length > 0) {
            const crewLaborCost = crewData.members.reduce(
              (total, member) => total + ((member.employee?.cost_per_hour || 0) * job.duration),
              0
            );
            setLaborCost(crewLaborCost);
          }
        } catch (error) {
          console.error('Error fetching crew details:', error);
        }
      } else if (job.employee && job.employee.cost_per_hour !== undefined) {
        // Calculate employee labor cost
        setLaborCost(job.employee.cost_per_hour * job.duration);
      }
    }

    fetchReportData();
  }, [job.id, job.vehicle.client.id, job.crew_id, job.employee, job.duration]);

  // Ensure we have valid numbers for calculations
  const baseAmount = (parseFloat(invoiceData.hourlyRate) || 0) * (job.duration || 0);
  const additionalAmount = invoiceData.additionalItems.reduce((sum, item) => 
    sum + (parseFloat(item.amount) || 0), 0
  );
  const totalAmount = baseAmount + additionalAmount;

  const generateInvoice = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Add company header
    doc.setFontSize(24);
    doc.text('Auto Maintenance', pageWidth / 2, yPos, { align: 'center' });

    yPos += 20;
    doc.setFontSize(12);
    doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });

    // Add invoice details
    yPos += 20;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    doc.text(`Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 20, yPos + 5);
    doc.text(`Invoice #: INV-${Date.now().toString().slice(-6)}`, 20, yPos + 10);

    // Add client details
    yPos += 25;
    doc.text('Bill To:', 20, yPos);
    doc.text(`${job.vehicle.client.first_name} ${job.vehicle.client.last_name}`, 20, yPos + 5);
    doc.text(`Vehicle: ${job.vehicle.make} ${job.vehicle.model}`, 20, yPos + 10);
    doc.text(`Registration: ${job.vehicle.registration}`, 20, yPos + 15);

    // Add assignee info
    if (job.employee) {
      doc.text(`Assigned to: ${job.employee.name}`, 20, yPos + 20);
    } else if (job.crew) {
      doc.text(`Assigned to Crew: ${job.crew.name}`, 20, yPos + 20);
    }

    // Add job details
    yPos += 30;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 5;
    doc.text('Description', 20, yPos);
    doc.text('Amount', pageWidth - 40, yPos);
    yPos += 5;
    doc.line(20, yPos, pageWidth - 20, yPos);

    // Add base service
    yPos += 10;
    doc.text(`${job.title} (${job.duration} hours @ $${invoiceData.hourlyRate}/hr)`, 20, yPos);
    doc.text(`$${baseAmount.toFixed(2)}`, pageWidth - 40, yPos);

    // Add inventory used items if any
    if (inventoryUsage.length > 0) {
      yPos += 15;
      doc.text('Materials:', 20, yPos);

      inventoryUsage.forEach((usage) => {
        yPos += 10;
        const itemCost = usage.quantity_used * usage.cost_at_time;
        doc.text(`${usage.item.name} (${usage.quantity_used} ${usage.item.unit})`, 20, yPos);
        doc.text(`$${itemCost.toFixed(2)}`, pageWidth - 40, yPos);
      });

      // Add material cost subtotal
      yPos += 10;
      doc.text('Material Subtotal:', 40, yPos);
      doc.text(`$${materialCost.toFixed(2)}`, pageWidth - 40, yPos);
    }

    // Add additional items
    if (invoiceData.additionalItems.length > 0) {
      yPos += 15;
      doc.text('Additional Charges:', 20, yPos);

      invoiceData.additionalItems.forEach((item) => {
        yPos += 10;
        doc.text(item.description, 20, yPos);
        doc.text(`$${(parseFloat(item.amount) || 0).toFixed(2)}`, pageWidth - 40, yPos);
      });
    }

    // Add total
    yPos += 15;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Total:', pageWidth - 80, yPos);
    doc.text(`$${(totalAmount + materialCost).toFixed(2)}`, pageWidth - 40, yPos);

    // Add labor breakdown
    if (job.employee?.cost_per_hour !== undefined || crewDetails?.members.length) {
      yPos += 20;
      doc.setFont(undefined, 'normal');
      doc.text('Labor Breakdown:', 20, yPos);
      yPos += 10;

      if (job.employee?.cost_per_hour !== undefined) {
        doc.text(`${job.employee.name}: ${job.duration} hours @ $${job.employee.cost_per_hour.toFixed(2)}/hr = $${(job.employee.cost_per_hour * job.duration).toFixed(2)}`, 30, yPos);
      } else if (crewDetails?.members.length) {
        doc.text(`Crew: ${crewDetails.name}`, 30, yPos);
        yPos += 5;

        crewDetails.members.forEach((member, index) => {
          if (member.employee?.cost_per_hour !== undefined) {
            yPos += 5;
            const memberCost = member.employee.cost_per_hour * job.duration;
            doc.text(`${member.employee.name}: ${job.duration} hours @ $${member.employee.cost_per_hour.toFixed(2)}/hr = $${memberCost.toFixed(2)}`, 40, yPos);
          }
        });

        yPos += 5;
        doc.text(`Total Crew Labor: $${laborCost.toFixed(2)}`, 30, yPos);
      }
    }

    // Add notes
    if (invoiceData.notes) {
      yPos += 20;
      doc.setFont(undefined, 'normal');
      doc.text('Notes:', 20, yPos);
      yPos += 5;
      const splitNotes = doc.splitTextToSize(invoiceData.notes, pageWidth - 40);
      doc.text(splitNotes, 20, yPos);
    }

    // Add footer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    doc.save(`invoice-${job.id}.pdf`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 max-w-2xl w-full border border-dark-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-dark-800 pt-2 z-10">
          <h3 className="text-xl font-semibold text-dark-50">{job.vehicle.make} {job.vehicle.model} Report</h3>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X size={20} />
          </button>
        </div>
        {/* Job Report Section */}
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Job Report</h4>
          <div className="text-sm text-dark-200 space-y-1">
            <p>Title: {job.title}</p>
            <p>Description: {job.description}</p>
            <p>Start Time: {new Date(job.start_time).toLocaleString()}</p>
            <p>Duration: {job.duration} hours</p>
            <p>End Time: {new Date(new Date(job.start_time).getTime() + job.duration * 60 * 60 * 1000).toLocaleString()}</p>
          </div>
        </section>
        {/* Client Information Section */}
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Client Information</h4>
          <div className="text-sm text-dark-200 space-y-1">
            <p>Name: {job.vehicle.client.first_name} {job.vehicle.client.last_name}</p>
            {clientDetails && (
              <>
                <p>Email: {clientDetails.email}</p>
                <p>Address: {clientDetails.street}, {clientDetails.city}, {clientDetails.state} {clientDetails.zip_code}</p>
              </>
            )}
          </div>
        </section>

        {/* Labor and Crew Section */}
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Labor Information</h4>
          {job.employee ? (
            <div className="text-sm text-dark-200 space-y-1">
              <p>Employee: {job.employee.name}</p>
              <p>Specialization: {job.employee.specialization}</p>
              <p>Labor Rate: ${typeof job.employee.cost_per_hour === 'number' ? job.employee.cost_per_hour.toFixed(2) : '0.00'}/hour</p>
              <p>Hours worked: {job.duration} hours</p>
              <p className="font-medium text-dark-100">
                Total Labor Cost: ${((typeof job.employee.cost_per_hour === 'number' ? job.employee.cost_per_hour : 0) * job.duration).toFixed(2)}
              </p>
            </div>
          ) : job.crew && crewDetails ? (
            <div className="text-sm text-dark-200">
              <p>Crew: {crewDetails.name}</p>
              {crewDetails.description && <p>Description: {crewDetails.description}</p>}
              <p className="mt-2 font-medium">Crew Members:</p>
              <ul className="list-disc list-inside mb-3">
                {crewDetails.members.map(member => {
                  const hourlyRate = typeof member.employee?.cost_per_hour === 'number' ? member.employee.cost_per_hour : 0;
                  const memberCost = hourlyRate * job.duration;
                  return (
                    <li key={member.id}>
                      {member.employee?.name} - {member.is_leader ? 'Leader' : 'Member'} -
                      ${hourlyRate.toFixed(2)}/hour × {job.duration} hours = ${memberCost.toFixed(2)}
                    </li>
                  );
                })}
              </ul>
              {crewDetails.members.length > 0 && (
                <>
                  <p className="mt-2">Hours worked per crew member: {job.duration} hours</p>
                  <p className="font-medium text-dark-100 border-t border-dark-600 pt-2">
                    Total Crew Labor Cost: ${laborCost.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-dark-300">No labor assigned.</p>
          )}
        </section>
        {/* Inventory Used Section */}
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Inventory Used</h4>
          {inventoryUsage.length > 0 ? (
            <>
              <ul className="text-sm text-dark-200 list-disc list-inside max-h-40 overflow-y-auto mb-3">
                {inventoryUsage.map((usage, idx) => (
                  <li key={idx}>
                    {usage.item.name}: {usage.quantity_used} {usage.item.unit} @ ${usage.cost_at_time.toFixed(2)} each = ${(usage.quantity_used * usage.cost_at_time).toFixed(2)} (used at {new Date(usage.used_at).toLocaleString()})
                  </li>
                ))}
              </ul>
              <div className="text-sm font-medium text-dark-100 border-t border-dark-600 pt-2">
                Total Material Cost: ${materialCost.toFixed(2)}
              </div>
            </>
          ) : (
            <p className="text-sm text-dark-300">No inventory used.</p>
          )}
        </section>
        {/* Generate Invoice Section */}
        <section className="bg-dark-700 border border-dark-600 rounded-lg p-4 space-y-6">
          <h4 className="text-lg font-medium text-dark-100 mb-2">Generate Invoice</h4>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Hourly Rate
            </label>
            <div className="relative w-32">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={16} />
              <input
                type="number"
                min="0"
                step="0.01"
                value={invoiceData.hourlyRate}
                onChange={(e) => setInvoiceData({ ...invoiceData, hourlyRate: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-3 py-2 text-dark-100"
              />
            </div>
            <p className="mt-1 text-sm text-dark-300">
              Base amount: ${baseAmount.toFixed(2)} ({job.duration} hours)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Additional Items
            </label>
            <div className="space-y-3">
              {invoiceData.additionalItems.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...invoiceData.additionalItems];
                      newItems[index].description = e.target.value;
                      setInvoiceData({ ...invoiceData, additionalItems: newItems });
                    }}
                    placeholder="Item description"
                    className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100"
                  />
                  <div className="relative w-32">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={16} />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...invoiceData.additionalItems];
                        newItems[index].amount = e.target.value;
                        setInvoiceData({ ...invoiceData, additionalItems: newItems });
                      }}
                      placeholder="Amount"
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-3 py-2 text-dark-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = invoiceData.additionalItems.filter((_, i) => i !== index);
                      setInvoiceData({ ...invoiceData, additionalItems: newItems });
                    }}
                    className="px-3 py-2 text-red-400 hover:bg-dark-700 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setInvoiceData({
                  ...invoiceData,
                  additionalItems: [...invoiceData.additionalItems, { description: '', amount: '' }]
                })}
                className="w-full px-4 py-2 text-blue-400 hover:bg-dark-700 rounded-lg border border-dark-600 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">
              Notes
            </label>
            <textarea
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100"
              rows={3}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-dark-700">
            <div className="text-lg font-medium text-dark-50">
              Total: ${totalAmount.toFixed(2)}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={generateInvoice}
                className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FileText size={16} />
                Generate Invoice
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  job: MaintenanceJob;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ job, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-dark-800 rounded-lg w-full max-w-md p-6 border border-dark-700">
      <h2 className="text-xl font-semibold text-dark-50 mb-4">Delete Task</h2>
      <p className="text-dark-200 mb-6">
        Are you sure you want to delete "{job.title}"? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-dark-50 rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const TaskCard: React.FC<{ 
  job: MaintenanceJob; 
  onDragStart: (e: React.DragEvent, jobId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewReport?: () => void;
  onArchive?: () => void;
}> = ({ job, onDragStart, onEdit, onDelete, onViewReport, onArchive }) => {
  const [progress, setProgress] = useState<number>(0);
  useEffect(() => {
    let isMounted = true;
    async function computeProgress() {
      try {
        console.log(`Computing progress for job ${job.id} with template ${job.template_id}`);
        console.log('Job todos:', job.todos);
        
        if (job.template_id) {
          const template = await getProgressTemplate(job.template_id);
          console.log('Template loaded:', template);
          
          if (isMounted && template && template.steps.length) {
            if (job.todos && job.todos.length > 0) {
              const completedSteps = template.steps.filter(step => {
                const isCompleted = job.todos.some(todo => todo.step_id === step.id && todo.completed);
                console.log(`Step ${step.id}: ${step.title} - Completed: ${isCompleted}`);
                return isCompleted;
              }).length;
              
              const progressValue = Math.round((completedSteps / template.steps.length) * 100);
              console.log(`TasksPage progress calculation: ${completedSteps}/${template.steps.length} = ${progressValue}%`);
              setProgress(progressValue);
            } else {
              // No todos yet
              console.log('No todos found for this job');
              setProgress(0);
            }
          } else if (isMounted) {
            console.log('Template not loaded or has no steps');
            setProgress(0);
          }
        } else if (isMounted) {
          console.log('Job has no template_id');
          setProgress(0);
        }
      } catch (err) {
        console.error('Error computing progress:', err);
        if (isMounted) setProgress(0);
      }
    }
    computeProgress();
    return () => { isMounted = false; };
  }, [job.template_id, job.todos]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, job.id)}
      className="bg-dark-800 rounded-lg shadow-sm p-4 mb-3 cursor-move hover:shadow-md transition-shadow border border-dark-700"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-dark-50">{job.title}</h3>
        <TaskMenu
          job={job}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewReport={onViewReport}
          onArchive={onArchive}
        />
      </div>
      <p className="text-sm text-dark-200 mb-3">{job.description}</p>
      
      {job.template_id && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-dark-300">Progress</span>
            <span className="text-xs font-medium text-dark-200">{progress}%</span>
          </div>
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="text-xs text-dark-300 space-y-1">
        <div>Vehicle: {job.vehicle.make} {job.vehicle.model} ({job.vehicle.registration})</div>
        <div>Assignee: {job.employee ? job.employee.name : job.crew ? `Crew: ${job.crew.name}` : 'Unassigned'}</div>
        <div>Client: {job.vehicle.client.first_name} {job.vehicle.client.last_name}</div>
        <div>Start: {new Date(job.start_time).toLocaleString()}</div>
        <div>Duration: {job.duration}h</div>
      </div>
    </div>
  );
};

const TaskColumn: React.FC<{
  title: string;
  jobs: MaintenanceJob[];
  status: MaintenanceJob['status'];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: MaintenanceJob['status']) => void;
  onDragStart: (e: React.DragEvent, jobId: string) => void;
  onEditJob: (job: MaintenanceJob) => void;
  onDeleteJob: (job: MaintenanceJob) => void;
  onViewReportJob: (job: MaintenanceJob) => void;
  onArchiveJob: (job: MaintenanceJob) => void;
}> = ({ title, jobs, status, onDragOver, onDrop, onDragStart, onEditJob, onDeleteJob, onViewReportJob, onArchiveJob }) => (
  <div
    className="bg-dark-900 rounded-lg p-4 w-80 flex-shrink-0"
    onDragOver={onDragOver}
    onDrop={(e) => onDrop(e, status)}
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-semibold text-dark-100">{title}</h2>
      <span className="bg-dark-800 text-dark-200 text-xs font-medium px-2 py-1 rounded-full">
        {Array.isArray(jobs) ? jobs.length : 0}
      </span>
    </div>
    <div className="space-y-3">
      {jobs.map(job => (
        <TaskCard 
          key={job.id}
          job={job}
          onDragStart={onDragStart}
          onEdit={() => onEditJob(job)}
          onDelete={() => onDeleteJob(job)}
          onViewReport={() => onViewReportJob(job)}
          onArchive={() => onArchiveJob(job)}
        />
      ))}
    </div>
  </div>
);

const TasksPage = () => {
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [deleteJob, setDeleteJob] = useState<MaintenanceJob | null>(null);
  const [completedJob, setCompletedJob] = useState<MaintenanceJob | null>(null);
  const [reportJob, setReportJob] = useState<MaintenanceJob | null>(null);
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('archivedJobs');
    return stored ? JSON.parse(stored) : [];
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const maintenanceJobs = await getMaintenanceJobs();
      setJobs(Array.isArray(maintenanceJobs) ? maintenanceJobs : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load maintenance jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData('jobId', jobId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: MaintenanceJob['status']) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('jobId');

    try {
      const job = jobs.find(j => j.id === jobId);
      if (job && job.status !== newStatus) {
        console.log(`Moving job ${jobId} from ${job.status} to ${newStatus}`);

        // Update status only for drag and drop
        const updatedJob = await updateMaintenanceJob(jobId, { status: newStatus });

        if (updatedJob) {
          // Update the job in the local state
          setJobs(prevJobs =>
            prevJobs.map(j => j.id === jobId ? updatedJob : j)
          );

          // Show invoice prompt when job is moved to 'done' status
          if (newStatus === 'done') {
            setCompletedJob(updatedJob);
          }
        } else {
          console.error('Failed to update job - no response from API');
          setError('Failed to update task status - no response from API');
        }
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      setError('Failed to update task status');
    }
  };

  const handleUpdateJob = async (updatedJob: MaintenanceJob) => {
    try {
      console.log('Handling job update:', updatedJob);
      console.log('Job todos before update:', updatedJob.todos);
      
      // Only send necessary data to the API
      const jobToUpdate = {
        ...updatedJob,
        // We don't need to send todos here as the toggleTodo function handles that
        // and the updateMaintenanceJob will fetch the latest todos
      };
      
      const updated = await updateMaintenanceJob(updatedJob.id, jobToUpdate);
      console.log('Job updated, response:', updated);
      
      if (updated) {
        // Update local state
        setJobs(prevJobs => {
          const newJobs = prevJobs.map(job => job.id === updated.id ? updated : job);
          console.log('Jobs after local update:', newJobs);
          return newJobs;
        });
        
        // Update the selected job if it's open
        setSelectedJob(prev => {
          if (prev && prev.id === updated.id) {
            console.log('Updating selected job:', updated);
            return updated;
          }
          return prev;
        });
        
        // Show invoice prompt when job is marked as done
        if (updated.status === 'done') {
          setCompletedJob(updated);
        }
      }
    } catch (err) {
      console.error('Error updating job:', err);
      setError('Failed to update maintenance job');
    }
  };

  const handleDeleteJob = async (job: MaintenanceJob) => {
    try {
      const deleted = await deleteMaintenanceJob(job.id);
      if (deleted) {
        setJobs(prevJobs => prevJobs.filter(j => j.id !== job.id));
        setDeleteJob(null);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete maintenance job');
    }
  };
  // Archive a job so it's hidden from task lists
  const handleArchiveJob = (jobId: string) => {
    const updated = [...archivedIds, jobId];
    setArchivedIds(updated);
    localStorage.setItem('archivedJobs', JSON.stringify(updated));
  };

  const getJobsByStatus = (status: MaintenanceJob['status']) => {
    return jobs.filter(job => job.status === status && !archivedIds.includes(job.id));
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-dark-800 rounded w-1/4"></div>
          <div className="flex gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-dark-900 rounded-lg p-4 w-80">
                <div className="h-6 bg-dark-800 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-32 bg-dark-800 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-dark-50">Maintenance Tasks</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex gap-6 overflow-x-auto pb-6">
        <TaskColumn
          title="Not Started"
          jobs={getJobsByStatus('not-started')}
          status="not-started"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onEditJob={setSelectedJob}
          onDeleteJob={setDeleteJob}
          onViewReportJob={setReportJob}
          onArchiveJob={(job) => handleArchiveJob(job.id)}
        />
        <TaskColumn
          title="In Progress"
          jobs={getJobsByStatus('in-progress')}
          status="in-progress"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onEditJob={setSelectedJob}
          onDeleteJob={setDeleteJob}
          onViewReportJob={setReportJob}
          onArchiveJob={(job) => handleArchiveJob(job.id)}
        />
        <TaskColumn
          title="Quality Assurance"
          jobs={getJobsByStatus('qa')}
          status="qa"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onEditJob={setSelectedJob}
          onDeleteJob={setDeleteJob}
          onViewReportJob={setReportJob}
          onArchiveJob={(job) => handleArchiveJob(job.id)}
        />
        <TaskColumn
          title="Completed"
          jobs={getJobsByStatus('done')}
          status="done"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onEditJob={setSelectedJob}
          onDeleteJob={setDeleteJob}
          onViewReportJob={setReportJob}
          onArchiveJob={(job) => handleArchiveJob(job.id)}
        />
      </div>

      {selectedJob && (
        <TaskModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSave={handleUpdateJob}
        />
      )}

      {deleteJob && (
        <DeleteConfirmModal
          job={deleteJob}
          onClose={() => setDeleteJob(null)}
          onConfirm={() => handleDeleteJob(deleteJob)}
        />
      )}

      {completedJob && (
        <InvoicePrompt
          job={completedJob}
          onClose={() => setCompletedJob(null)}
        />
      )}
      {reportJob && (
        <ReportModal
          job={reportJob}
          onClose={() => setReportJob(null)}
        />
      )}
    </div>
  );
};

export default TasksPage;