import React, { useEffect, useState } from 'react';
import WebsiteCard from './WebsiteCard';
import { Globe, Zap, TrendingUp, Brain } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

function Dashboard({ websites, onEditWebsite, onDeleteWebsite }) {
  const activeWebsites = websites.filter(w => w.isActive);
  const inactiveWebsites = websites.filter(w => !w.isActive);

  const [maxIntervalCheck, setMaxIntervalCheck] = useState(null);
  const [hasAIFeatures, setHasAIFeatures] = useState(false);
  const [loading, setLoading] = useState(true);

  const getMaxInterval = (planType) => {
    switch (planType?.toLowerCase()) {
      case 'free': return 300;
      case 'starter': return 60;
      case 'professional': return 30;
      case 'enterprise': return 15;
      default: return 300;
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token'); // or however you store it
        if (!token) throw new Error("Missing token");

        const res = await axios.get(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { planType } = res.data;
        const interval = getMaxInterval(planType);

        setMaxIntervalCheck(interval);
        setHasAIFeatures(['professional', 'enterprise'].includes(planType?.toLowerCase()));
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setMaxIntervalCheck(300); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  if (websites.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-lg mx-auto">
          <div className="glass-card rounded-3xl p-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center floating-animation">
                <Globe className="h-12 w-12 text-blue-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No websites to monitor</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Get started by adding your first website to monitor its uptime, performance, and availability in real-time.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Real-time monitoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Performance tracking</span>
              </div>
              {hasAIFeatures && (
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>AI predictions</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Monitored Websites</h2>
            <p className="text-gray-600">
              Currently monitoring <span className="font-semibold text-blue-600">{activeWebsites.length}</span> active websites
              {inactiveWebsites.length > 0 && (
                <span className="text-gray-500"> ({inactiveWebsites.length} inactive)</span>
              )}
              {hasAIFeatures && (
                <span className="ml-2 inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Brain className="h-3 w-3" />
                  <span>AI Enabled</span>
                </span>
              )}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live monitoring active (checks every {
                maxIntervalCheck >= 60
                  ? `${Math.floor(maxIntervalCheck / 60)}min`
                  : `${maxIntervalCheck}sec`
              })</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Websites */}
      {activeWebsites.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Monitoring</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {activeWebsites.map((website) => (
              <WebsiteCard
                key={website.id}
                website={website}
                onEdit={() => onEditWebsite(website)}
                onDelete={() => onDeleteWebsite(website.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Websites */}
      {inactiveWebsites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            Inactive Websites
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Plan Limit Exceeded
            </span>
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> These websites have been deactivated because they exceed your current plan limits.
              Upgrade your plan to reactivate them or manually activate your preferred websites.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {inactiveWebsites.map((website) => (
              <WebsiteCard
                key={website.id}
                website={website}
                onEdit={() => onEditWebsite(website)}
                onDelete={() => onDeleteWebsite(website.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
