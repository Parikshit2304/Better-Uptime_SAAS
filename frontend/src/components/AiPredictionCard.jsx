import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';

// const API_BASE = import.meta.env.PROD ? `${import.meta.env.BACKEND_URL}/api` : 'http://localhost:3001/api';
const API_BASE =`${import.meta.env.VITE_BACKEND_URL}/api`;

function AIPredictionCard({ websiteId, websiteName, planType }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (['professional', 'enterprise'].includes(planType)) {
      fetchPrediction();
    } else {
      setLoading(false);
    }
  }, [websiteId, planType]);

  const fetchPrediction = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/ai-prediction/website/${websiteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data.prediction);
      } else if (response.status === 404) {
        setPrediction(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Error fetching AI prediction:', error);
      setError('Failed to fetch AI prediction');
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/ai-prediction/analyze/${websiteId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Wait a bit then refresh prediction
        setTimeout(() => {
          fetchPrediction();
        },1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
      setError('Failed to trigger analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!['professional', 'enterprise'].includes(planType)) {
    return (
      <div className="glass-card rounded-2xl p-6 border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">AI Outage Prediction</h3>
          <p className="text-gray-600 text-sm mb-4">
            Upgrade to Professional or Enterprise to unlock AI-powered outage predictions and advanced analytics.
          </p>
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium">
            <Shield className="h-4 w-4" />
            <span>Professional Feature</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Prediction</h3>
            <p className="text-sm text-gray-500">Loading analysis...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-red-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Prediction Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={triggerAnalysis}
          disabled={analyzing}
          className="modern-button text-sm"
        >
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Analysis
            </>
          )}
        </button>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="glass-card rounded-2xl p-6">
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Prediction</h3>
            <p className="text-sm text-gray-500">No analysis available yet</p>
          </div>
          
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Start AI analysis to get predictive insights about potential outages and performance issues.
        </p>
        <button
          onClick={triggerAnalysis}
          disabled={analyzing}
          className="modern-button text-sm"
        >
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Start AI Analysis
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Prediction</h3>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(prediction.createdAt).toLocaleString()}
              </p>
            </div>
            
          </div>
          <button
            onClick={triggerAnalysis}
            disabled={analyzing}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Refresh Analysis"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${analyzing ? 'animate-spin' : ''}`} />
          </button>
          
        </div>
        
      </div>

      <div className="p-6">
        {/* Risk Level & Health Score */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border ${getRiskColor(prediction.riskLevel)}`}>
            {getRiskIcon(prediction.riskLevel)}
            <div>
              <p className="font-semibold text-sm capitalize">{prediction.riskLevel} Risk</p>
              <p className="text-xs opacity-75">{prediction.predictionConfidence}% confidence</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {prediction.healthScore}%
            </div>
            <div className="text-xs text-blue-700 font-medium">Health Score</div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">{prediction.summary}</p>
        </div>

        {/* Outage Prediction */}
        {prediction.predictedOutageWindow.likelihood > 20 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-semibold text-orange-800">Outage Prediction</span>
            </div>
            <p className="text-sm text-orange-700">
              {prediction.predictedOutageWindow.likelihood}% chance of outage in the{' '}
              <span className="font-medium">
                {prediction.predictedOutageWindow.timeframe.replace('_', ' ')}
              </span>
            </p>
          </div>
        )}

        {/* Performance Trends */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Performance Trends</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center space-x-2 mb-1">
                {getTrendIcon(prediction.performanceTrends.responseTime)}
                <span className="text-xs font-medium text-gray-700">Response Time</span>
              </div>
              <p className="text-xs text-gray-600 capitalize">{prediction.performanceTrends.responseTime}</p>
            </div>
            
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center space-x-2 mb-1">
                {getTrendIcon(prediction.performanceTrends.uptime)}
                <span className="text-xs font-medium text-gray-700">Uptime</span>
              </div>
              <p className="text-xs text-gray-600 capitalize">{prediction.performanceTrends.uptime}</p>
            </div>
            
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center space-x-2 mb-1">
                {getTrendIcon(prediction.performanceTrends.reliability)}
                <span className="text-xs font-medium text-gray-700">Reliability</span>
              </div>
              <p className="text-xs text-gray-600 capitalize">{prediction.performanceTrends.reliability}</p>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <span className="font-medium text-gray-700">Detailed Analysis</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4">
            {/* Risk Factors */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Key Risk Factors</h5>
              <div className="space-y-2">
                {prediction.keyRiskFactors.map((factor, index) => (
                  <div key={index} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{factor.factor}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(factor.severity)}`}>
                        {factor.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Recommendations</h5>
              <div className="space-y-2">
                {prediction.recommendations.map((rec, index) => (
                  <div key={index} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{rec.action}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{rec.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIPredictionCard;