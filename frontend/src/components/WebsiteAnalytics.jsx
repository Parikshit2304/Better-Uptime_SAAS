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
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import { 
  TrendingUp, 
  Clock, 
  Activity, 
  AlertTriangle, 
  BarChart3,
  Calendar,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';
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
  ArcElement
);

//const API_BASE = import.meta.env.PROD ? `${import.meta.env.BACKEND_URL}/api` : 'http://localhost:3001/api';
const API_BASE =`${import.meta.env.BACKEND_URL}/api`;

function WebsiteAnalytics({ website, onClose }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [website.id, timeRange]);

  const fetchAnalytics = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE}/analytics?website=${website.id}&range=${timeRange}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching website analytics:', error);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <BarChart3 className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading analytics<span className="loading-dots"></span></p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h3>
            <p className="text-gray-600 mb-4">Unable to fetch analytics data for {website.name}</p>
            <button onClick={handleRefresh} className="modern-button">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    overview,
    uptimeHistory,
    responseTimeHistory,
    incidentHistory,
    statusDistribution
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
        pointRadius: 4,
        pointHoverRadius: 6,
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
        borderRadius: 6,
        borderSkipped: false,
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

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
  <div className="fixed inset-0  z-50 overflow-y-auto ">
    <div className="glass-card rounded-3xl shadow-2xl w-full max-w-7xl bg-white relative">
      {/* Close Button aligned to top-right */}
      <div className="flex justify-end p-1">
        
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* AI Prediction Card */}
      <div className="px-3 pb-4">
        <AIPredictionCard 
          websiteId={website.id} 
          websiteName={website.name}
          planType={currentUser.planType}
        />
      </div>
    </div>
  </div>
);

}

export default WebsiteAnalytics;