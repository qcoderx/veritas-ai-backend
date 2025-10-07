import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Claims Processed',
        data: [120, 190, 300, 500, 200, 300],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Fraud Detected',
        data: [12, 19, 30, 45, 25, 35],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: '#374151',
        },
      },
      y: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: '#374151',
        },
      },
    },
  };
  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">
          Reports & Analytics
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-slate-800 rounded-lg">
          <div className="text-sm mb-2 text-slate-400">
            Total Claims Processed
          </div>
          <div className="text-3xl font-bold mb-4 text-white">
            1,428
          </div>
          <div className="text-sm flex items-center gap-1 text-emerald-400">
            <i className="fa-solid fa-arrow-up"></i>
            12% vs last month
          </div>
        </div>
        
        <div className="p-6 bg-slate-800 rounded-lg">
          <div className="text-sm mb-2 text-slate-400">
            Potential Fraud Detected
          </div>
          <div className="text-3xl font-bold mb-4 text-white">
            ₦ 11,450,000
          </div>
          <div className="text-sm flex items-center gap-1 text-emerald-400">
            <i className="fa-solid fa-arrow-up"></i>
            ₦ 1.2M vs last month
          </div>
        </div>
        
        <div className="p-6 bg-slate-800 rounded-lg">
          <div className="text-sm mb-2 text-slate-400">
            Avg. Processing Time
          </div>
          <div className="text-3xl font-bold mb-4 text-white">
            2.1 Hours
          </div>
          <div className="text-sm flex items-center gap-1 text-emerald-400">
            <i className="fa-solid fa-arrow-down"></i>
            45 mins faster
          </div>
        </div>
        
        <div className="p-6 bg-slate-800 rounded-lg">
          <div className="text-sm mb-2 text-slate-400">
            High-Risk Flag Rate
          </div>
          <div className="text-3xl font-bold mb-4 text-white">
            8.2%
          </div>
          <div className="text-sm flex items-center gap-1 text-emerald-400">
            <i className="fa-solid fa-arrow-up"></i>
            0.5% vs last month
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="p-6 bg-slate-800 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Claims Analytics</h3>
        <div className="h-96">
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Reports;