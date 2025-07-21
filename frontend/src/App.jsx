import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import PricingModal from './components/PricingModal';
import Dashboard from './components/Dashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AddWebsiteModal from './components/AddWebsiteModal';
import EditWebsiteModal from './components/EditWebsiteModal';
import ResetPasswordPage from './components/ResetPasswordPage';
import { Plus, Activity, Globe, RefreshCw, Zap, TrendingUp, Shield, BarChart3, User, LogOut, Settings, CreditCard } from 'lucide-react';
import axios from 'axios';
//const API_BASE = import.meta.env.PROD ? `${import.meta.env.BACKEND_URL}/api` : 'http://localhost:3001/api';
const API_BASE =`${import.meta.env.BACKEND_URL}/api`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [currentView, setCurrentView] = useState('dashboard');
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [error, setError] = useState(null);
  const [resetToken, setResetToken] = useState(null);
   const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    planType: '',
  });

  useEffect(() => {
    // Check for reset password token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetTokenFromUrl = urlParams.get('token');
    
    if (resetTokenFromUrl) {
      setResetToken(resetTokenFromUrl);
      setLoading(false);
      return;
    }

    // Check if user is logged in
    const authToken = localStorage.getItem('token');
    const user = localStorage.getItem('user');
        const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token'); // or sessionStorage.getItem('authToken')

        const res = await axios(`${API_BASE}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        console.log('User data fetched:', res.data);

        setUserData({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          planType: res.data.planType,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
    
    if (authToken && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
      
      // Check for successful payment
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        handlePaymentSuccess(sessionId);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentView === 'dashboard') {
      fetchWebsites();
      // Refresh data every 30 seconds
      const interval = setInterval(fetchWebsites, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentView]);

  const fetchWebsites = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/websites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setWebsites(data);
    } catch (error) {
      console.error('Error fetching websites:', error);
      setError('Failed to fetch websites. Please check if the server is running.');
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };
  const handlePaymentSuccess = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/subscription/handle-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        const data = await response.json();
        // Update current user with new subscription info
        const updatedUser = { ...currentUser, ...data.subscription };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Refresh websites to apply new limits
        await fetchWebsites();
        
        alert('Payment successful! Your subscription has been activated.');
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  };

  const handleRefresh = () => {
    if (currentView === 'dashboard') {
      fetchWebsites(true);
    }
  };

  const handleAddWebsite = async (websiteData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/websites`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(websiteData)
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchWebsites();
        setShowAddModal(false);
        return { success: true };
      } else {
        return { success: false, error: data.error || data.message || 'Failed to add website' };
      }
    } catch (error) {
      console.error('Error adding website:', error);
      return { success: false, error: 'Failed to add website' };
    }
  };

  const handleEditWebsite = async (id, websiteData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/websites/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(websiteData)
      });

      if (response.ok) {
        await fetchWebsites();
        setEditingWebsite(null);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to update website' };
      }
    } catch (error) {
      console.error('Error updating website:', error);
      return { success: false, error: 'Failed to update website' };
    }
  };

  const handleDeleteWebsite = async (id) => {
    if (window.confirm('Are you sure you want to delete this website? This will also delete all associated downtime logs.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/websites/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          await fetchWebsites();
        } else {
          alert('Failed to delete website');
        }
      } catch (error) {
        console.error('Error deleting website:', error);
        alert('Failed to delete website');
      }
    }
  };

  const handleAuthSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setShowAuthModal(false);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setWebsites([]);
    setCurrentView('dashboard');
  };

  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const handlePlanChange = (newSubscription) => {
    setCurrentUser(prev => ({
      ...prev,
      ...newSubscription
    }));
  };

  const handleResetPasswordSuccess = () => {
    setResetToken(null);
    setAuthMode('signin');
    setShowAuthModal(true);
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Show reset password page if token is present
  if (resetToken) {
    return (
      <ResetPasswordPage 
        token={resetToken}
        onSuccess={handleResetPasswordSuccess}
        onCancel={() => {
          setResetToken(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <>
        <LandingPage 
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  const upWebsites = websites.filter(w => w.status === 'up').length;
  const downWebsites = websites.filter(w => w.status === 'down').length;
  const unknownWebsites = websites.filter(w => w.status === 'unknown').length;
  const avgUptime = websites.length > 0 ? websites.reduce((acc, w) => acc + (w.uptimePercentage || 0), 0) / websites.length : 0;
  const avgResponseTime = websites.length > 0 ? websites.reduce((acc, w) => acc + (w.responseTime || 0), 0) / websites.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-600 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading dashboard<span className="loading-dots"></span></p>
          <div className="mt-2 w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="glass-card rounded-3xl p-8">
            <div className="text-red-500 mb-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Connection Error</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={handleRefresh}
              className="modern-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && currentView === 'analytics') {
    return <AnalyticsDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg floating-animation">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Uptime Monitor</h1>
                <p className="text-sm text-gray-500 font-medium">
                  Welcome back, {userData.firstName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-2 bg-white/50 rounded-2xl p-2">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    currentView === 'dashboard' 
                      ? 'bg-white shadow-md text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">Dashboard</span>
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    currentView === 'analytics' 
                      ? 'bg-white shadow-md text-purple-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Analytics</span>
                </button>
              </nav>

              {/* Stats Overview */}
              <div className="hidden xl:flex items-center space-x-6">
                <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-xl">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-semibold">{upWebsites} Online</span>
                </div>
                <div className="flex items-center space-x-3 bg-red-50 px-4 py-2 rounded-xl">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold">{downWebsites} Offline</span>
                </div>
                {unknownWebsites > 0 && (
                  <div className="flex items-center space-x-3 bg-yellow-50 px-4 py-2 rounded-xl">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-700 font-semibold">{unknownWebsites} Unknown</span>
                  </div>
                )}
                <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-xl">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-semibold">{websites.length} Total</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-gray-900">{userData.firstName} {userData.lastName}</p>
                      <p className="text-xs text-gray-500 capitalize">{userData.planType} Plan</p>
                    </div>
                  </button>
                  
                  <div className="absolute right-0 top-16 w-48 glass-card rounded-2xl shadow-xl border border-white/20 py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button
                      onClick={() => setShowPricingModal(true)}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 w-full text-left transition-colors rounded-xl mx-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Billing & Plans</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors rounded-xl mx-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-3 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50 group"
                  title="Refresh"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                </button>
                
                <button
                  onClick={() => setShowAddModal(true)}
                  disabled={websites.filter(w => w.isActive).length >= currentUser?.maxWebsites}
                  className="modern-button"
                  title={websites.filter(w => w.isActive).length >= currentUser?.maxWebsites ? `Website limit reached (${currentUser?.maxWebsites} websites). Upgrade your plan.` : 'Add Website'}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Website
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      {isAuthenticated && websites.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Uptime</p>
                  <p className="text-3xl font-bold text-green-600">{avgUptime.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-3xl font-bold text-blue-600">{Math.round(avgResponseTime)}ms</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                  <p className="text-3xl font-bold text-orange-600">{websites.reduce((acc, w) => acc + (w.downtimeCount || 0), 0)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monitored Sites</p>
                  <p className="text-3xl font-bold text-purple-600">{websites.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isAuthenticated && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Dashboard 
          websites={websites}
          onEditWebsite={setEditingWebsite}
          onDeleteWebsite={handleDeleteWebsite}
        />
        </main>
      )}

      {/* Modals */}
      {isAuthenticated && showAddModal && (
        <AddWebsiteModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddWebsite}
        />
      )}

      {isAuthenticated && editingWebsite && (
        <EditWebsiteModal
          website={editingWebsite}
          onClose={() => setEditingWebsite(null)}
          onSubmit={(data) => handleEditWebsite(editingWebsite.id, data)}
        />
      )}

      {isAuthenticated && (
        <>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            mode={authMode}
            onSuccess={handleAuthSuccess}
          />
          <PricingModal
            isOpen={showPricingModal}
            onClose={() => setShowPricingModal(false)}
            currentUser={currentUser}
            onPlanChange={handlePlanChange}
          />
        </>
      )}
    </div>
  );
}

export default App;