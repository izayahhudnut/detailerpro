import React, { useState, useEffect } from 'react';
import { CreditCard, Receipt, Building2, ArrowRight, CheckCircle2, Plus, Calendar, DollarSign, X, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { MaintenanceJob, getMaintenanceJobs } from '../lib/data';
import jsPDF from 'jspdf';

interface PaymentPlatform {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
}

const InvoicingPage = () => {
  const location = useLocation();
  const jobId = location.state?.jobId;

  const [platforms] = useState<PaymentPlatform[]>([
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept payments and manage your business globally',
      icon: <CreditCard className="text-purple-400" size={24} />,
      connected: false
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Complete accounting and financial management',
      icon: <Building2 className="text-blue-400" size={24} />,
      connected: true
    },
    {
      id: 'square',
      name: 'Square',
      description: 'Point of sale and payment processing solutions',
      icon: <Receipt className="text-green-400" size={24} />,
      connected: false
    }
  ]);

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [invoiceData, setInvoiceData] = useState({
    client: '',
    job: '',
    dueDate: '',
    platform: '',
    items: [{ description: '', amount: '' }],
    additionalNotes: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      if (jobId) {
        const jobs = await getMaintenanceJobs();
        const job = jobs.find(j => j.id === jobId);
        if (job) {
          setSelectedJob(job);
          setShowInvoiceForm(true);
          setInvoiceData({
            client: `${job.vehicle.client.first_name} ${job.vehicle.client.last_name}`,
            job: job.title,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            platform: 'quickbooks',
            items: [
              {
                description: `${job.title} - ${job.vehicle.make} ${job.vehicle.model} (${job.vehicle.registration})`,
                amount: (job.duration * 85).toString() // Example hourly rate
              }
            ],
            additionalNotes: job.description || ''
          });
        }
      }
    };

    fetchJob();
  }, [jobId]);

  const handleConnect = (platformId: string) => {
    setSelectedPlatform(platformId);
  };

  const generatePDF = () => {
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
    doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, 20, yPos + 5);
    doc.text(`Invoice #: INV-${Date.now().toString().slice(-6)}`, 20, yPos + 10);

    // Add client details
    yPos += 25;
    doc.text('Bill To:', 20, yPos);
    doc.text(invoiceData.client, 20, yPos + 5);

    // Add items
    yPos += 20;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 5;
    doc.text('Description', 20, yPos);
    doc.text('Amount', pageWidth - 40, yPos);
    yPos += 5;
    doc.line(20, yPos, pageWidth - 20, yPos);

    let total = 0;
    invoiceData.items.forEach((item, index) => {
      yPos += 10;
      doc.text(item.description, 20, yPos);
      doc.text(`$${item.amount}`, pageWidth - 40, yPos);
      total += parseFloat(item.amount) || 0;
    });

    // Add total
    yPos += 15;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Total:', pageWidth - 80, yPos);
    doc.text(`$${total.toFixed(2)}`, pageWidth - 40, yPos);

    // Add notes
    if (invoiceData.additionalNotes) {
      yPos += 20;
      doc.setFont(undefined, 'normal');
      doc.text('Notes:', 20, yPos);
      yPos += 5;
      doc.text(invoiceData.additionalNotes, 20, yPos);
    }

    // Add footer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    doc.save(`invoice-${Date.now()}.pdf`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl text-dark-50 mb-2">Invoicing & Payments</h1>
        <p className="text-dark-300">
          Connect with your preferred payment and accounting platforms to streamline your billing process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-dark-800 rounded-lg p-6 border border-dark-700 hover:border-dark-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {platform.icon}
                <div>
                  <h3 className="font-medium text-dark-50">{platform.name}</h3>
                  <p className="text-sm text-dark-300">{platform.description}</p>
                </div>
              </div>
              {platform.connected && (
                <span className="flex items-center gap-1 text-sm text-green-400">
                  <CheckCircle2 size={16} />
                  Connected
                </span>
              )}
            </div>
            <button
              onClick={() => handleConnect(platform.id)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                platform.connected
                  ? 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  : 'bg-blue-600 text-dark-50 hover:bg-blue-700'
              }`}
            >
              {platform.connected ? 'Manage Connection' : 'Connect'}
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-dark-50">Quick Invoice</h2>
        {!showInvoiceForm && (
          <button
            onClick={() => setShowInvoiceForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        )}
      </div>

      {showInvoiceForm && (
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-medium text-dark-100">New Invoice</h3>
            <button
              onClick={() => setShowInvoiceForm(false)}
              className="text-dark-400 hover:text-dark-200"
            >
              <X size={20} />
            </button>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Client
                </label>
                <input
                  type="text"
                  value={invoiceData.client}
                  onChange={(e) => setInvoiceData({ ...invoiceData, client: e.target.value })}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Job
                </label>
                <input
                  type="text"
                  value={invoiceData.job}
                  onChange={(e) => setInvoiceData({ ...invoiceData, job: e.target.value })}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={16} />
                  <input
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-3 py-2 text-dark-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Payment Platform
                </label>
                <select
                  value={invoiceData.platform}
                  onChange={(e) => setInvoiceData({ ...invoiceData, platform: e.target.value })}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100"
                >
                  {platforms.filter(p => p.connected).map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Items
              </label>
              <div className="space-y-3">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...invoiceData.items];
                        newItems[index].description = e.target.value;
                        setInvoiceData({ ...invoiceData, items: newItems });
                      }}
                      placeholder="Item description"
                      className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-400"
                    />
                    <div className="relative w-32">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={16} />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => {
                          const newItems = [...invoiceData.items];
                          newItems[index].amount = e.target.value;
                          setInvoiceData({ ...invoiceData, items: newItems });
                        }}
                        placeholder="Amount"
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-3 py-2 text-dark-100 placeholder-dark-400"
                      />
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = invoiceData.items.filter((_, i) => i !== index);
                          setInvoiceData({ ...invoiceData, items: newItems });
                        }}
                        className="px-3 py-2 text-red-400 hover:bg-dark-700 rounded-lg"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setInvoiceData({
                    ...invoiceData,
                    items: [...invoiceData.items, { description: '', amount: '' }]
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
                Additional Notes
              </label>
              <textarea
                value={invoiceData.additionalNotes}
                onChange={(e) => setInvoiceData({ ...invoiceData, additionalNotes: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-dark-700">
              <button
                type="button"
                onClick={() => setShowInvoiceForm(false)}
                className="px-4 py-2 text-dark-200 hover:bg-dark-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generatePDF}
                className="px-4 py-2 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FileText size={16} />
                Generate Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-dark-50 mb-4">Recent Invoices</h2>
        <div className="bg-dark-800 rounded-lg border border-dark-700">
          <div className="p-6 text-center text-dark-300">
            No recent invoices found
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicingPage;