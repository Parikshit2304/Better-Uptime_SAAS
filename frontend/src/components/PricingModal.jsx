import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Crown, Zap, Shield, Star } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:3001/api';
//const API_BASE =`${import.meta.env.VITE_BACKEND_URL}/api`;


function PricingModal({ isOpen, onClose, currentUser, onPlanChange }) {
  const [plans, setPlans] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [processingPlan, setProcessingPlan] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPlansAndSubscription();
    }
  }, [isOpen]);

  const fetchPlansAndSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch plans
      const plansResponse = await fetch(`${API_BASE}/subscription/plans`);
      const plansData = await plansResponse.json();
      setPlans(plansData.plans);

      // Fetch current subscription
      const subResponse = await fetch(`${API_BASE}/subscription/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subData = await subResponse.json();
      setCurrentSubscription(subData.subscription);
      setSelectedPlan(subData.subscription.planType);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleUpgrade = async (planType) => {
    setProcessingPlan(planType);
    try {
      const token = localStorage.getItem('token');
      
      // For free plan, handle downgrade directly
      if (planType === 'free') {
        const response = await fetch(`${API_BASE}/subscription/upgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            planType: 'free'
          })
        });

        const data = await response.json();

        if (response.ok) {
          onPlanChange(data.subscription);
          onClose();
          alert('Successfully downgraded to free plan. Some websites may have been deactivated to comply with the plan limits.');
        } else {
          alert(data.error || 'Failed to downgrade plan');
        }
        return;
      }
      
      // For paid plans, create checkout session
      const response = await fetch(`${API_BASE}/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planType,
          duration: billingCycle
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to create checkout session');
        }
      } else {
        alert(data.error || 'Failed to upgrade plan');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to upgrade plan');
    } finally {
      setProcessingPlan('');
    }
  };

  if (!isOpen) return null;

  const planOrder = ['free', 'starter', 'professional', 'enterprise'];
  const orderedPlans = planOrder.map(key => ({ key, ...plans[key] })).filter(plan => plan.name);

  const getPlanIcon = (planKey) => {
    switch (planKey) {
      case 'free': return <Star className="h-6 w-6" />;
      case 'starter': return <Zap className="h-6 w-6" />;
      case 'professional': return <Crown className="h-6 w-6" />;
      case 'enterprise': return <Shield className="h-6 w-6" />;
      default: return <Star className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planKey) => {
    switch (planKey) {
      case 'free': return 'from-gray-500 to-gray-600';
      case 'starter': return 'from-blue-500 to-blue-600';
      case 'professional': return 'from-purple-500 to-purple-600';
      case 'enterprise': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPrice = (plan, cycle) => {
    if (plan.price === 0) return '$0';
    const price = cycle === 'yearly' ? plan.price * 10 : plan.price; // 2 months free on yearly
    return `$${price}`;
  };

  const getSavings = (plan) => {
    if (plan.price === 0) return null;
    const monthlyCost = plan.price * 12;
    const yearlyCost = plan.price * 10;
    const savings = Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
    return savings;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="text-gray-600 mt-2">Upgrade or downgrade at any time</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 rounded-2xl p-1 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-md text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white shadow-md text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {orderedPlans.map((plan) => {
              const isCurrentPlan = currentSubscription?.planType === plan.key;
              const isPopular = plan.key === 'starter';
              
              return (
                <div
                  key={plan.key}
                  className={`relative glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    isPopular ? 'ring-2 ring-blue-500 scale-105' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-r ${getPlanColor(plan.key)} rounded-2xl flex items-center justify-center text-white`}>
                      {getPlanIcon(plan.key)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {getPrice(plan, billingCycle)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-600 ml-1">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && plan.price > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        Save {getSavings(plan)}% annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={processingPlan === plan.key || isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      isCurrentPlan
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } disabled:opacity-50`}
                  >
                    {processingPlan === plan.key ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.key === 'free' ? (
                      'Downgrade'
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Current Usage */}
          {currentSubscription && (
            <div className="mt-8 glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Current Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Websites</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentUser?.websiteCount || 0} / {currentSubscription.maxWebsites}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Check Interval</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor(currentSubscription.maxCheckInterval / 60)}min
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plan Status</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {currentSubscription.subscriptionStatus}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PricingModal;