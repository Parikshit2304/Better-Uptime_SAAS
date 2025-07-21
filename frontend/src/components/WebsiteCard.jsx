import React, { useState } from 'react';
import { Globe, Clock, MoreVertical, Edit, Trash2, ExternalLink, Pause, Play, Activity, AlertTriangle, BarChart3 } from 'lucide-react';
import WebsiteAnalytics from './WebsiteAnalytics';

function WebsiteCard({ website, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const {
    name,
    url,
    status,
    lastChecked,
    responseTime,
    uptimePercentage,
    downtimeCount,
    isActive,
    uptimeChecks = []
  } = website;

  // Use real uptime checks data for the last 30 minutes
  const recentChecks = uptimeChecks.slice(0, 30).reverse(); // Get last 30 checks and reverse for chronological order

  const getStatusColor = (status) => {
    switch (status) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'up': return <Activity className="h-4 w-4" />;
      case 'down': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTickColor = (tickStatus) => {
    switch (tickStatus) {
      case 'up': return 'bg-green-500 hover:bg-green-600';
      case 'down': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-300 hover:bg-gray-400';
    }
  };

  const formatLastChecked = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const checked = new Date(date);
    const diff = now - checked;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const formatUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch {
      return url;
    }
  };

  return (
    <div className={`glass-card rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-2 group ${!isActive ? 'opacity-60' : ''}`}>
      {/* Status Header */}
      <div className={`px-6 py-4 border-b border-gray-100 ${status === 'up' ? 'bg-gradient-to-r from-green-50 to-emerald-50' : status === 'down' ? 'bg-gradient-to-r from-red-50 to-rose-50' : 'bg-gradient-to-r from-yellow-50 to-amber-50'}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-3 px-4 py-2 rounded-2xl border ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            <span className="font-semibold text-sm">
              {!isActive && <Pause className="h-3 w-3 mr-1 inline" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {!isActive && ' (Paused)'}
            </span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors group-hover:bg-white/70"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-12 w-40 glass-card rounded-2xl shadow-xl border border-white/20 py-2 z-20">
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 w-full text-left transition-colors rounded-xl mx-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Website</span>
                </button>
                <button
                  onClick={() => {
                    setShowAnalytics(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 w-full text-left transition-colors rounded-xl mx-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>View Analytics</span>
                </button>
                <button
                  onClick={() => {
                    // Toggle active status
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 w-full text-left transition-colors rounded-xl mx-2"
                >
                  {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isActive ? 'Pause Monitoring' : 'Resume Monitoring'}</span>
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors rounded-xl mx-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Website</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Website Info */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${status === 'up' ? 'bg-green-500' : status === 'down' ? 'bg-red-500' : 'bg-yellow-500'} ${status === 'up' ? 'animate-pulse' : ''}`}></div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-gray-900 truncate mb-1" title={name}>{name}</h3>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-2 group/link"
              title={url}
            >
              <span className="truncate max-w-[200px]">{formatUrl(url)}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>

        {/* Real Uptime Visualization */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Recent checks</span>
            <span className="text-xs text-gray-500">{recentChecks.length} checks</span>
          </div>
          <div className="flex items-end space-x-1 h-8">
            {recentChecks.length > 0 ? (
              recentChecks.map((check, index) => (
                <div
                  key={check.id || index}
                  className={`tick-indicator ${getTickColor(check.status)} cursor-pointer`}
                  style={{ height: check.responseTime ? `${Math.min(Math.max(check.responseTime / 10, 4), 32)}px` : '4px' }}
                  title={`${check.status.toUpperCase()} - ${check.responseTime ? `${check.responseTime}ms` : 'No response'} - ${new Date(check.timestamp).toLocaleTimeString()}`}
                />
              ))
            ) : (
              // Show placeholder if no data
              Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className="tick-indicator bg-gray-200"
                  style={{ height: '4px' }}
                  title="No data"
                />
              ))
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Oldest</span>
            <span>Latest</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {uptimePercentage !== undefined ? `${uptimePercentage.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-green-700 font-medium">30-day uptime</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1 flex items-center">
              {responseTime ? `${responseTime}ms` : 'N/A'}
            </div>
            <div className="text-xs text-blue-700 font-medium">Response time</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {downtimeCount || 0}
            </div>
            <div className="text-xs text-orange-700 font-medium">Incidents (30d)</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {formatLastChecked(lastChecked)}
            </div>
            <div className="text-xs text-purple-700 font-medium">Last checked</div>
          </div>
        </div>

        {/* Performance Indicator */}
        {uptimePercentage !== undefined && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Health</span>
              <span className="text-sm font-bold text-gray-900">{uptimePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  uptimePercentage >= 99 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  uptimePercentage >= 95 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                  'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                style={{ width: `${Math.max(uptimePercentage, 2)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <WebsiteAnalytics
          website={website}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  );
}

export default WebsiteCard;