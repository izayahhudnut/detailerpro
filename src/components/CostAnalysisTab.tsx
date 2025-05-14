import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Filter, BarChart2, PieChart, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Type definitions
interface CostBreakdownItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  id?: string; // Optional id for identifying items in "All" view
}

interface JobCostData {
  job_id: string;
  job_title: string;
  material_cost: number;
  labor_cost: number;
  total_cost: number;
}

interface TrendData {
  date: string;
  value: number;
}

interface EmployeeCost {
  employee_id: string;
  employee_name: string;
  hours_worked: number;
  cost: number;
}

interface CrewCost {
  crew_id: string;
  crew_name: string;
  hours_worked: number;
  cost: number;
}

const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#14B8A6', // teal-500
  '#6366F1', // indigo-500
];

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
  }).format(value / 100);
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// A simple progress bar component for visual representation
const ProgressBar: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => {
  return (
    <div className="w-full bg-dark-600 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      ></div>
    </div>
  );
};

// CSS-based pie chart
const CssPieChart: React.FC<{ data: CostBreakdownItem[] }> = ({ data }) => {
  // No data case
  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-dark-400">No data available</span>
      </div>
    );
  }

  // Single item case - just show a full circle
  if (data.length === 1) {
    return (
      <div className="h-64 flex justify-center items-center">
        <div
          className="w-64 h-64 rounded-full shadow-lg"
          style={{ backgroundColor: data[0].color }}
        >
        </div>
      </div>
    );
  }

  // Multiple items - create CSS pie chart with conic gradient
  // Sort data by percentage (highest first) for better visualization
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);

  // Create conic gradient
  let gradientString = '';
  let currentPercentage = 0;

  sortedData.forEach((item, index) => {
    if (index === 0) {
      gradientString += `${item.color} 0%`;
      currentPercentage += item.percentage;
      gradientString += `, ${item.color} ${currentPercentage}%`;
    } else {
      gradientString += `, ${item.color} ${currentPercentage}%`;
      currentPercentage += item.percentage;
      gradientString += `, ${item.color} ${currentPercentage}%`;
    }
  });

  return (
    <div className="flex justify-center items-center h-64">
      <div
        className="w-64 h-64 rounded-full shadow-lg"
        style={{
          background: `conic-gradient(${gradientString})`
        }}
      ></div>
    </div>
  );
};

const CostAnalysisTab: React.FC = () => {
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [totalCost, setTotalCost] = useState(0);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>([]);
  const [topJobs, setTopJobs] = useState<JobCostData[]>([]);
  const [costTrend, setCostTrend] = useState<TrendData[]>([]);
  const [employeeCosts, setEmployeeCosts] = useState<EmployeeCost[]>([]);
  const [crewCosts, setCrewCosts] = useState<CrewCost[]>([]);
  const [inventoryCostsByType, setInventoryCostsByType] = useState<CostBreakdownItem[]>([]);
  const [activeBreakdown, setActiveBreakdown] = useState<'category' | 'job' | 'employee' | 'crew' | 'client' | 'product' | 'all'>('category');
  
  // Fetch all cost analysis data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate the start date based on the selected range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (dateRange) {
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        }
        
        // 1. Fetch inventory usage (material costs)
        const { data: inventoryUsage, error: inventoryError } = await supabase
          .from('job_inventory')
          .select(`
            id,
            quantity_used,
            cost_at_time,
            used_at,
            item:inventory(id, name, type, unit),
            job_id
          `)
          .gte('used_at', startDate.toISOString())
          .lte('used_at', endDate.toISOString());
          
        if (inventoryError) throw inventoryError;
        
        // 2. Fetch jobs with employee and crew data for labor costs
        const { data: jobs, error: jobsError } = await supabase
          .from('maintenance_jobs')
          .select(`
            id,
            title,
            duration,
            start_time,
            vehicle_id,
            employee_id,
            crew_id,
            vehicle:vehicles(
              id,
              client:clients(id, first_name, last_name)
            ),
            employee:employees(id, name, cost_per_hour),
            crew:crews(id, name)
          `)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());
          
        if (jobsError) throw jobsError;
        
        // 3. Fetch crew members to calculate crew costs
        const { data: crewMembers, error: crewError } = await supabase
          .from('crew_members')
          .select(`
            id,
            crew_id,
            is_leader,
            employee:employees(id, name, cost_per_hour)
          `);
          
        if (crewError) throw crewError;
        
        // 4. Process the data
        if (jobs && inventoryUsage) {
          processData(jobs, inventoryUsage, crewMembers || []);
        }
        
      } catch (err) {
        console.error('Error fetching cost analysis data:', err);
        setError('Failed to load cost analysis data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);
  
  // Process the fetched data
  const processData = (
    jobs: any[], 
    inventoryUsage: any[], 
    crewMembers: any[]
  ) => {
    // Create a map of crew_id to an array of employee costs
    const crewEmployeeCosts = new Map<string, { id: string, name: string, costPerHour: number }[]>();
    
    crewMembers.forEach(member => {
      if (!member.employee) return;
      
      const employeeData = {
        id: member.employee.id,
        name: member.employee.name,
        costPerHour: member.employee.cost_per_hour || 0
      };
      
      if (crewEmployeeCosts.has(member.crew_id)) {
        crewEmployeeCosts.get(member.crew_id)?.push(employeeData);
      } else {
        crewEmployeeCosts.set(member.crew_id, [employeeData]);
      }
    });
    
    // Calculate job costs and group data
    const jobCosts: Record<string, JobCostData> = {};
    const employeeCostsMap: Record<string, EmployeeCost> = {};
    const crewCostsMap: Record<string, CrewCost> = {};
    const clientCostsMap: Record<string, number> = {};
    let materialCostTotal = 0;
    let laborCostTotal = 0;
    
    // Calculate total inventory costs by type (tool vs product)
    const productCosts: Record<string, number> = {};
    const toolCosts: Record<string, number> = {};
    
    inventoryUsage.forEach(usage => {
      const cost = usage.quantity_used * usage.cost_at_time;
      materialCostTotal += cost;
      
      // Add to job costs
      if (usage.job_id) {
        if (!jobCosts[usage.job_id]) {
          const job = jobs.find(j => j.id === usage.job_id);
          jobCosts[usage.job_id] = {
            job_id: usage.job_id,
            job_title: job ? job.title : 'Unknown Job',
            material_cost: 0,
            labor_cost: 0,
            total_cost: 0
          };
        }
        
        jobCosts[usage.job_id].material_cost += cost;
        jobCosts[usage.job_id].total_cost += cost;
      }
      
      // Aggregate by inventory type
      if (usage.item && usage.item.type === 'product') {
        productCosts[usage.item.name] = (productCosts[usage.item.name] || 0) + cost;
      } else if (usage.item && usage.item.type === 'tool') {
        toolCosts[usage.item.name] = (toolCosts[usage.item.name] || 0) + cost;
      }
    });
    
    // Process jobs for labor costs
    jobs.forEach(job => {
      let laborCost = 0;
      
      // Calculate individual employee cost
      if (job.employee && job.employee.cost_per_hour) {
        const employeeCost = job.duration * (job.employee.cost_per_hour || 0);
        laborCost += employeeCost;
        
        // Add to employee costs tracking
        if (!employeeCostsMap[job.employee.id]) {
          employeeCostsMap[job.employee.id] = {
            employee_id: job.employee.id,
            employee_name: job.employee.name,
            hours_worked: 0,
            cost: 0
          };
        }
        
        employeeCostsMap[job.employee.id].hours_worked += job.duration;
        employeeCostsMap[job.employee.id].cost += employeeCost;
      }
      
      // Calculate crew cost
      if (job.crew_id) {
        const crewEmployees = crewEmployeeCosts.get(job.crew_id) || [];
        let crewCost = 0;
        
        crewEmployees.forEach(employee => {
          const individualCost = job.duration * (employee.costPerHour || 0);
          crewCost += individualCost;
          
          // Also track individual employee costs within crews
          if (!employeeCostsMap[employee.id]) {
            employeeCostsMap[employee.id] = {
              employee_id: employee.id,
              employee_name: employee.name,
              hours_worked: 0,
              cost: 0
            };
          }
          
          employeeCostsMap[employee.id].hours_worked += job.duration;
          employeeCostsMap[employee.id].cost += individualCost;
        });
        
        laborCost = Math.max(laborCost, crewCost); // Use higher of individual or crew cost
        
        // Add to crew costs tracking
        if (!crewCostsMap[job.crew_id]) {
          crewCostsMap[job.crew_id] = {
            crew_id: job.crew_id,
            crew_name: job.crew?.name || 'Unknown Crew',
            hours_worked: 0,
            cost: 0
          };
        }
        
        crewCostsMap[job.crew_id].hours_worked += job.duration;
        crewCostsMap[job.crew_id].cost += crewCost;
      }
      
      // Add labor cost to job tracking
      if (jobCosts[job.id]) {
        jobCosts[job.id].labor_cost += laborCost;
        jobCosts[job.id].total_cost += laborCost;
      } else {
        jobCosts[job.id] = {
          job_id: job.id,
          job_title: job.title,
          material_cost: 0,
          labor_cost: laborCost,
          total_cost: laborCost
        };
      }
      
      // Add to client costs
      if (job.vehicle && job.vehicle.client) {
        const clientId = job.vehicle.client.id;
        const clientName = `${job.vehicle.client.first_name} ${job.vehicle.client.last_name}`;
        
        if (!clientCostsMap[clientId]) {
          clientCostsMap[clientId] = 0;
        }
        
        clientCostsMap[clientId] += jobCosts[job.id].total_cost;
      }
      
      // Add to total labor costs
      laborCostTotal += laborCost;
    });
    
    // Calculate total cost
    const total = materialCostTotal + laborCostTotal;
    setTotalCost(total);
    
    // Create pie chart data for main cost breakdown
    const breakdownData: CostBreakdownItem[] = [
      {
        name: 'Labor',
        value: laborCostTotal,
        percentage: total ? Math.round((laborCostTotal / total) * 100) : 0,
        color: CHART_COLORS[0]
      },
      {
        name: 'Materials',
        value: materialCostTotal,
        percentage: total ? Math.round((materialCostTotal / total) * 100) : 0,
        color: CHART_COLORS[1]
      }
    ];
    setCostBreakdown(breakdownData);
    
    // Create inventory type breakdown
    const productTotal = Object.values(productCosts).reduce((sum, cost) => sum + cost, 0);
    const toolTotal = Object.values(toolCosts).reduce((sum, cost) => sum + cost, 0);
    
    const inventoryTypeBreakdown: CostBreakdownItem[] = [];
    
    if (productTotal > 0) {
      inventoryTypeBreakdown.push({
        name: 'Products',
        value: productTotal,
        percentage: materialCostTotal ? Math.round((productTotal / materialCostTotal) * 100) : 0,
        color: CHART_COLORS[2]
      });
    }
    
    if (toolTotal > 0) {
      inventoryTypeBreakdown.push({
        name: 'Tools',
        value: toolTotal,
        percentage: materialCostTotal ? Math.round((toolTotal / materialCostTotal) * 100) : 0,
        color: CHART_COLORS[3]
      });
    }
    
    setInventoryCostsByType(inventoryTypeBreakdown);
    
    // Set top jobs by cost
    const topJobsList = Object.values(jobCosts)
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, 5);
    setTopJobs(topJobsList);
    
    // Set employee costs
    const employeeCostsList = Object.values(employeeCostsMap)
      .sort((a, b) => b.cost - a.cost);
    setEmployeeCosts(employeeCostsList);
    
    // Set crew costs
    const crewCostsList = Object.values(crewCostsMap)
      .sort((a, b) => b.cost - a.cost);
    setCrewCosts(crewCostsList);
    
    // Create trend data (simplified - in real app would be more granular by date)
    // This just creates a dummy trend for demonstration purposes
    const trendPoints = 7; // Show 7 data points for the trend
    const trendData: TrendData[] = [];
    
    for (let i = 0; i < trendPoints; i++) {
      const date = new Date();
      
      // Adjust date based on the selected range
      switch (dateRange) {
        case 'week':
          date.setDate(date.getDate() - i);
          break;
        case 'month':
          date.setDate(date.getDate() - (i * 4)); // Approximately 4 days per point
          break;
        case 'quarter':
          date.setDate(date.getDate() - (i * 12)); // Approximately 12 days per point 
          break;
        case 'year':
          date.setMonth(date.getMonth() - i); // One month per point
          break;
      }
      
      // Create fake trend data
      // In a real app, this would be aggregated from actual data
      const dailyTotal = (total / trendPoints) * (0.7 + (Math.random() * 0.6));
      
      trendData.unshift({
        date: date.toISOString(),
        value: dailyTotal
      });
    }
    
    setCostTrend(trendData);
  };
  
  // Get the current data to display based on active breakdown
  const getCurrentBreakdownData = () => {
    let data: CostBreakdownItem[] = [];

    switch (activeBreakdown) {
      case 'category':
        data = costBreakdown;
        break;
      case 'job':
        data = topJobs.map((job, index) => ({
          id: job.job_id,
          name: job.job_title,
          value: job.total_cost,
          percentage: totalCost ? Math.round((job.total_cost / totalCost) * 100) : 0,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }));
        break;
      case 'employee':
        data = employeeCosts.slice(0, 5).map((emp, index) => ({
          id: emp.employee_id,
          name: emp.employee_name,
          value: emp.cost,
          percentage: totalCost ? Math.round((emp.cost / totalCost) * 100) : 0,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }));
        break;
      case 'crew':
        data = crewCosts.slice(0, 5).map((crew, index) => ({
          id: crew.crew_id,
          name: crew.crew_name,
          value: crew.cost,
          percentage: totalCost ? Math.round((crew.cost / totalCost) * 100) : 0,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }));
        break;
      case 'product':
        data = inventoryCostsByType;
        break;
      case 'all':
        // Combine all data sources

        // Labor and Material from category breakdown
        const categoryItems = costBreakdown.map(item => ({
          ...item,
          id: `category-${item.name}`,
          group: 'Category'
        }));

        // Top jobs
        const jobItems = topJobs.slice(0, 3).map((job, index) => ({
          id: `job-${job.job_id}`,
          name: `Job: ${job.job_title}`,
          value: job.total_cost,
          percentage: totalCost ? Math.round((job.total_cost / totalCost) * 100) : 0,
          color: CHART_COLORS[(index + 2) % CHART_COLORS.length],
          group: 'Jobs'
        }));

        // Top employees
        const employeeItems = employeeCosts.slice(0, 2).map((emp, index) => ({
          id: `employee-${emp.employee_id}`,
          name: `Staff: ${emp.employee_name}`,
          value: emp.cost,
          percentage: totalCost ? Math.round((emp.cost / totalCost) * 100) : 0,
          color: CHART_COLORS[(index + 5) % CHART_COLORS.length],
          group: 'Staff'
        }));

        // Top crews
        const crewItems = crewCosts.slice(0, 2).map((crew, index) => ({
          id: `crew-${crew.crew_id}`,
          name: `Crew: ${crew.crew_name}`,
          value: crew.cost,
          percentage: totalCost ? Math.round((crew.cost / totalCost) * 100) : 0,
          color: CHART_COLORS[(index + 7) % CHART_COLORS.length],
          group: 'Crews'
        }));

        // Products breakdown
        const productItems = inventoryCostsByType.map((item, index) => ({
          ...item,
          id: `product-${item.name}`,
          name: `${item.name}`,
          color: CHART_COLORS[(index + 9) % CHART_COLORS.length],
          group: 'Products'
        }));

        // Combine all items
        data = [
          ...categoryItems,
          ...jobItems,
          ...employeeItems,
          ...crewItems,
          ...productItems
        ];

        // Recalculate percentages based on total
        const combinedTotal = data.reduce((sum, item) => sum + item.value, 0);
        data = data.map(item => ({
          ...item,
          percentage: combinedTotal ? Math.round((item.value / combinedTotal) * 100) : 0
        }));

        // Sort by value
        data.sort((a, b) => b.value - a.value);

        // Limit to top 10
        data = data.slice(0, 10);

        break;
    }

    return data;
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-dark-700 rounded-lg mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-dark-700 rounded-lg"></div>
          <div className="h-72 bg-dark-700 rounded-lg"></div>
        </div>
        <div className="h-72 bg-dark-700 rounded-lg"></div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with date filter and totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-dark-300">Date Range</h3>
            <Calendar size={18} className="text-dark-400" />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="w-full bg-dark-800 border border-dark-600 rounded text-dark-100 py-2 px-3"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-dark-300">Total Costs</h3>
            <DollarSign size={18} className="text-dark-400" />
          </div>
          <div className="text-2xl font-semibold text-dark-50">{formatCurrency(totalCost)}</div>
          <div className="mt-1 text-xs text-dark-400">All expenses in selected period</div>
        </div>
        
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-dark-300">Cost Breakdown</h3>
            <div className="flex items-center gap-2">
              <button className="text-xs bg-dark-800 hover:bg-dark-600 rounded px-1.5 py-0.5 text-dark-300">
                <Filter size={12} className="inline mr-1" />
                Filter
              </button>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <span className="text-dark-300 text-xs">Labor:</span>
              <div className="text-dark-100">{formatCurrency(costBreakdown.find(item => item.name === 'Labor')?.value || 0)}</div>
            </div>
            <div>
              <span className="text-dark-300 text-xs">Materials:</span>
              <div className="text-dark-100">{formatCurrency(costBreakdown.find(item => item.name === 'Materials')?.value || 0)}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cost Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-dark-100">Cost Distribution</h3>
            <div className="flex bg-dark-800 rounded-md p-0.5">
              <button
                onClick={() => setActiveBreakdown('all')}
                className={`px-3 py-1 text-xs rounded-md ${
                  activeBreakdown === 'all'
                    ? 'bg-blue-600 text-dark-50'
                    : 'text-dark-300 hover:text-dark-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveBreakdown('category')}
                className={`px-3 py-1 text-xs rounded-md ${
                  activeBreakdown === 'category'
                    ? 'bg-blue-600 text-dark-50'
                    : 'text-dark-300 hover:text-dark-100'
                }`}
              >
                Category
              </button>
              <button
                onClick={() => setActiveBreakdown('job')}
                className={`px-3 py-1 text-xs rounded-md ${
                  activeBreakdown === 'job'
                    ? 'bg-blue-600 text-dark-50'
                    : 'text-dark-300 hover:text-dark-100'
                }`}
              >
                Jobs
              </button>
              <button
                onClick={() => setActiveBreakdown('employee')}
                className={`px-3 py-1 text-xs rounded-md ${
                  activeBreakdown === 'employee'
                    ? 'bg-blue-600 text-dark-50'
                    : 'text-dark-300 hover:text-dark-100'
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => setActiveBreakdown('crew')}
                className={`px-3 py-1 text-xs rounded-md ${
                  activeBreakdown === 'crew'
                    ? 'bg-blue-600 text-dark-50'
                    : 'text-dark-300 hover:text-dark-100'
                }`}
              >
                Crews
              </button>
              <button
                onClick={() => setActiveBreakdown('product')}
                className={`px-3 py-1 text-xs rounded-md ${
                  activeBreakdown === 'product'
                    ? 'bg-blue-600 text-dark-50'
                    : 'text-dark-300 hover:text-dark-100'
                }`}
              >
                Products
              </button>
            </div>
          </div>

          {/* CSS-based pie chart */}
          <div className="mb-4">
            <CssPieChart data={getCurrentBreakdownData()} />
          </div>

          {/* Table view under the pie chart */}
          <div className="overflow-hidden mb-4 mt-2">
            <table className="min-w-full">
              <thead className="border-b border-dark-600">
                <tr>
                  <th className="text-left py-2 px-4 text-dark-300 text-sm font-medium">Item</th>
                  <th className="text-right py-2 px-4 text-dark-300 text-sm font-medium">Amount</th>
                  <th className="text-right py-2 px-4 text-dark-300 text-sm font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {getCurrentBreakdownData().map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-dark-600/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                        <span className="text-dark-100">
                          {item.name}
                          {item.group && <span className="ml-1 text-xs text-dark-400">({item.group})</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-dark-100">{formatCurrency(item.value)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <span className="text-dark-100 mr-2">{item.percentage}%</span>
                        <div className="w-16">
                          <ProgressBar percentage={item.percentage} color={item.color} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-dark-700 rounded-lg p-4">
          <h3 className="text-md font-medium text-dark-100 mb-4">Top Cost Entries</h3>
          
          <div className="space-y-3">
            {topJobs.slice(0, 4).map((job, index) => (
              <div key={job.job_id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  ></div>
                  <div className="truncate max-w-[200px]">
                    <div className="text-dark-100 truncate">{job.job_title}</div>
                    <div className="text-xs text-dark-400">Job #{job.job_id.substring(0, 8)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-dark-100">{formatCurrency(job.total_cost)}</div>
                  <div className="text-xs text-dark-400">
                    Labor: {formatCurrency(job.labor_cost)} | Materials: {formatCurrency(job.material_cost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="font-medium text-dark-100 mb-2">Employee & Crew Costs</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-dark-600 rounded p-3">
                <div className="text-sm text-dark-300 mb-1">Top Employee</div>
                {employeeCosts.length > 0 ? (
                  <div>
                    <div className="text-dark-100">{employeeCosts[0].employee_name}</div>
                    <div className="text-xs text-dark-400">
                      {employeeCosts[0].hours_worked} hours | {formatCurrency(employeeCosts[0].cost)}
                    </div>
                  </div>
                ) : (
                  <div className="text-dark-400 text-sm">No data</div>
                )}
              </div>
              <div className="border border-dark-600 rounded p-3">
                <div className="text-sm text-dark-300 mb-1">Top Crew</div>
                {crewCosts.length > 0 ? (
                  <div>
                    <div className="text-dark-100">{crewCosts[0].crew_name}</div>
                    <div className="text-xs text-dark-400">
                      {crewCosts[0].hours_worked} hours | {formatCurrency(crewCosts[0].cost)}
                    </div>
                  </div>
                ) : (
                  <div className="text-dark-400 text-sm">No data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trend Analysis Section */}
      <div className="bg-dark-700 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-dark-100">Cost Trend Analysis</h3>
          <div className="flex items-center gap-2 text-dark-300 text-sm">
            <TrendingUp size={16} className="text-blue-500" />
            <span>
              {costTrend.length > 1 && 
                (costTrend[costTrend.length - 1].value > costTrend[0].value
                  ? <span className="text-red-400 flex items-center"><ArrowUp size={14} /> {formatPercentage(
                      Math.round(((costTrend[costTrend.length - 1].value - costTrend[0].value) / costTrend[0].value) * 100)
                    )} increase</span>
                  : <span className="text-green-400 flex items-center"><ArrowDown size={14} /> {formatPercentage(
                      Math.round(((costTrend[0].value - costTrend[costTrend.length - 1].value) / costTrend[0].value) * 100)
                    )} decrease</span>
                )
              }
            </span>
          </div>
        </div>
        
        {/* Table-based visualization of trend */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-dark-600">
              <tr>
                {costTrend.map((item, index) => (
                  <th key={index} className="text-dark-300 text-sm font-medium p-2">
                    {formatDate(item.date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {costTrend.map((item, index) => (
                  <td key={index} className="p-2">
                    <div className="text-dark-100 text-center mb-1">{formatCurrency(item.value)}</div>
                    <div 
                      className="mx-auto bg-blue-600/60 rounded" 
                      style={{ 
                        height: '60px', 
                        width: '20px',
                        // Scale the height based on the value relative to the max value
                        opacity: item.value / Math.max(...costTrend.map(i => i.value)) 
                      }}
                    ></div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default CostAnalysisTab;