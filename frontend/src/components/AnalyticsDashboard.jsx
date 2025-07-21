import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import App from '../App';
import Dashboard from './Dashboard';
import AIPredictionCard from './AiPredictionCard';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

function AnalyticsDashboard() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState('analytics');

  useEffect(() => {
    fetchData();
  }, [selectedWebsite, timeRange]);

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);

      const token = localStorage.getItem('token');

      // Fetch websites
      const websitesResponse = await fetch(`${API_BASE}/websites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const websitesData = await websitesResponse.json();
      setWebsites(websitesData);

      // Fetch analytics data
      const analyticsResponse = await fetch(
        `${API_BASE}/analytics?website=${selectedWebsite}&range=${timeRange}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const analytics = await analyticsResponse.json();
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <BarChart3 className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading analytics<span className="loading-dots"></span></p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-gray-600 mb-4">Unable to fetch analytics data</p>
          <button onClick={handleRefresh} className="modern-button">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    overview,
    uptimeHistory,
    responseTimeHistory,
    incidentHistory,
    statusDistribution,
    performanceMetrics
  } = analyticsData;
  // Chart configurations
  const uptimeChartData = {
    labels: uptimeHistory.map(item => format(new Date(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Uptime %',
        data: uptimeHistory.map(item => item.uptime),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  };

  const responseTimeChartData = {
    labels: responseTimeHistory.map(item => format(new Date(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Avg Response Time (ms)',
        data: responseTimeHistory.map(item => item.avgResponseTime),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const statusDistributionData = {
    labels: ['Online', 'Offline', 'Unknown'],
    datasets: [
      {
        data: [
          statusDistribution.up || 0,
          statusDistribution.down || 0,
          statusDistribution.unknown || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)'
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      }
    },
    cutout: '60%'
  };
  if (currentView === 'dashboard') {
      return <App/>;
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg floating-animation">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500 font-medium">Historical data and performance insights</p>
                
              </div>
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-2 bg-white/50 rounded-2xl p-2">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${currentView === 'dashboard'
                      ? 'bg-white shadow-md text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                >
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">Dashboard</span>
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${currentView === 'analytics'
                      ? 'bg-white shadow-md text-purple-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Analytics</span>
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50 group"
                title="Refresh Data"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
              </button>

              <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-200">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-semibold text-gray-700">Filters</span>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">Website:</label>
                <select
                  value={selectedWebsite}
                  onChange={(e) => setSelectedWebsite(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Websites</option>
                  {websites.map(website => (
                    <option key={website.id} value={website.id}>{website.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">Period:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
                  
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Uptime</p>
                <p className="text-3xl font-bold text-green-600">{overview.avgUptime.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  {overview.uptimeTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${overview.uptimeTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(overview.uptimeTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-3xl font-bold text-blue-600">{Math.round(overview.avgResponseTime)}ms</p>
                <div className="flex items-center mt-2">
                  {overview.responseTimeTrend <= 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${overview.responseTimeTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(overview.responseTimeTrend).toFixed(0)}ms
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                <p className="text-3xl font-bold text-red-600">{overview.totalIncidents}</p>
                <div className="flex items-center mt-2">
                  {overview.incidentTrend <= 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${overview.incidentTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(overview.incidentTrend)}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">MTTR</p>
                <p className="text-3xl font-bold text-purple-600">{overview.mttr}min</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm font-medium text-purple-600">
                    Mean Time to Recovery
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Uptime Trend Chart */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Uptime Trend</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Activity className="h-4 w-4" />
                <span>Daily Average</span>
              </div>
            </div>
            <div className="h-80">
              <Line data={uptimeChartData} options={chartOptions} />
            </div>
          </div>

          {/* Response Time Chart */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Response Time</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Daily Average</span>
              </div>
            </div>
            <div className="h-80">
              <Bar data={responseTimeChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Status Distribution and Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Status Distribution */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Status Distribution</h3>
              <PieChart className="h-5 w-5 text-gray-500" />
            </div>
            <div className="h-64">
              <Doughnut data={statusDistributionData} options={doughnutOptions} />
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {performanceMetrics.bestUptime.toFixed(1)}%
                </div>
                <div className="text-sm text-green-700 font-medium">Best Uptime</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {performanceMetrics.fastestResponse}ms
                </div>
                <div className="text-sm text-blue-700 font-medium">Fastest Response</div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {performanceMetrics.worstUptime.toFixed(1)}%
                </div>
                <div className="text-sm text-red-700 font-medium">Worst Uptime</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {performanceMetrics.slowestResponse}ms
                </div>
                <div className="text-sm text-orange-700 font-medium">Slowest Response</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        {incidentHistory.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Incidents</h3>
            <div className="space-y-4">
              {incidentHistory.slice(0, 5).map((incident, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">{incident.websiteName}</p>
                      <p className="text-sm text-gray-600">{incident.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(incident.startTime), 'MMM dd, HH:mm')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Duration: {incident.duration}min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;