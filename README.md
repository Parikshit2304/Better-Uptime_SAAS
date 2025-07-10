# 🚀 UptimeMonitor - Professional Website Monitoring Platform

<div align="center">

![UptimeMonitor Logo](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=center)

**Monitor your websites like a pro with real-time alerts, advanced analytics, and AI-powered predictions**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

[🌟 Features](#-features) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🔧 Configuration](#-configuration) • [🤝 Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [🎯 Usage](#-usage)
- [📊 Analytics & AI](#-analytics--ai)
- [💳 Subscription Plans](#-subscription-plans)
- [🔐 Authentication](#-authentication)
- [📡 API Reference](#-api-reference)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🔧 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

### 🔍 **Real-Time Monitoring**
- **Multi-frequency checks**: 15 seconds to 5 minutes based on your plan
- **Global monitoring**: Check from multiple locations worldwide
- **Smart alerting**: Instant notifications via email, SMS, and webhooks
- **Status pages**: Beautiful public status pages for your services

### 📊 **Advanced Analytics**
- **Performance metrics**: Response times, uptime percentages, and trends
- **Historical data**: Up to unlimited history based on your plan
- **Custom dashboards**: Personalized views with filtering and grouping
- **Detailed reports**: Comprehensive incident analysis and performance reports

### 🤖 **AI-Powered Predictions** *(Professional & Enterprise)*
- **Outage prediction**: AI analyzes patterns to predict potential downtime
- **Performance forecasting**: Anticipate performance degradation
- **Risk assessment**: Identify websites at risk of failure
- **Intelligent recommendations**: Actionable insights to improve reliability

### 🔔 **Smart Notifications**
- **Multi-channel alerts**: Email, SMS, Slack, Discord, webhooks
- **Escalation policies**: Route alerts to the right people at the right time
- **Alert grouping**: Reduce noise with intelligent alert consolidation
- **Custom schedules**: Set maintenance windows and notification preferences

### 🛡️ **Enterprise Security**
- **SOC 2 compliant**: Enterprise-grade security and compliance
- **Role-based access**: Team management with granular permissions
- **API security**: Secure API access with rate limiting and authentication
- **Data encryption**: End-to-end encryption for all sensitive data

---

## 🏗️ Architecture

![Architecture Diagram](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop&crop=center)

### **Technology Stack**

#### **Frontend**
- **React 18** - Modern UI with hooks and concurrent features
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Chart.js** - Beautiful, responsive charts and graphs
- **Lucide React** - Consistent icon library
- **Vite** - Lightning-fast build tool and dev server

#### **Backend**
- **Node.js** - JavaScript runtime for server-side logic
- **Express.js** - Fast, minimalist web framework
- **Prisma ORM** - Type-safe database access with migrations
- **SQLite** - Lightweight, serverless database (easily upgradeable to PostgreSQL)
- **JWT** - Secure authentication and authorization

#### **Monitoring Engine**
- **Cron Jobs** - Scheduled monitoring with second-level precision
- **Axios** - HTTP client for website checks with timeout handling
- **Node-cron** - Reliable job scheduling for monitoring tasks

#### **AI & Analytics**
- **Google Gemini AI** - Advanced AI for outage prediction and analysis
- **Custom Analytics Engine** - Real-time data processing and insights
- **Time-series Data** - Optimized storage for monitoring metrics

#### **Payment Processing**
- **Stripe** - Secure payment processing with webhooks
- **Subscription Management** - Automated billing and plan management

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Git for version control
- A Stripe account (for payments)
- Google AI API key (for AI features)

### **1-Minute Setup**

```bash
# Clone the repository
git clone https://github.com/yourusername/uptime-monitor.git
cd uptime-monitor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize the database
npm run db:push

# Start the development servers
npm run dev
```

🎉 **That's it!** Your monitoring platform will be running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

---

## 📦 Installation

### **Development Setup**

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/uptime-monitor.git
   cd uptime-monitor
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

3. **Configure Environment Variables**
   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # Server
   PORT=3001
   NODE_ENV=development

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

   # Gemini AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-in-production

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # NodeMailer Setup
   EMAIL="your-gmailid"
   EMAIL_PASS=your-google-app-password
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

### **Production Setup**

1. **Environment Variables**
   ```env
   NODE_ENV=production
   DATABASE_URL="your-production-database-url"
   FRONTEND_URL="https://yourdomain.com"
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   npm start
   ```

---

## 🔧 Configuration

### **Stripe Setup**

![Stripe Dashboard](https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&crop=center)

1. **Create Stripe Account**
   - Visit [Stripe Dashboard](https://dashboard.stripe.com)
   - Complete account verification

2. **Get API Keys**
   - Navigate to Developers → API Keys
   - Copy your publishable and secret keys

3. **Create Products**
   ```bash
   # Create products for each plan in Stripe Dashboard
   # Starter Plan: $9/month
   # Professional Plan: $29/month  
   # Enterprise Plan: $99/month
   ```

4. **Configure Webhooks**
   - Endpoint: `https://yourdomain.com/api/subscription/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

### **Google AI Setup**

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Add to environment variables

2. **Configure AI Features**
   ```javascript
   // AI prediction runs every 30 minutes for Pro/Enterprise users
   // Analyzes website performance patterns
   // Provides risk assessment and recommendations
   ```

### **Email Configuration**

```env
# SMTP Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
```

---

## 🎯 Usage

### **Dashboard Overview**

![Dashboard Screenshot](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=center)

The main dashboard provides:
- **Real-time status** of all monitored websites
- **Performance metrics** with visual indicators
- **Recent incidents** and their resolution times
- **Quick actions** for adding, editing, and managing websites

### **Adding Websites**

1. **Click "Add Website"** button in the header
2. **Enter website details**:
   - Name (e.g., "My Company Website")
   - URL (e.g., "https://example.com")
3. **Configure monitoring** (automatic based on your plan)
4. **Start monitoring** immediately

### **Monitoring Features**

#### **Real-Time Checks**
- **Frequency**: Based on your subscription plan
  - Free: 5-minute intervals
  - Starter: 1-minute intervals
  - Professional: 30-second intervals
  - Enterprise: 15-second intervals

#### **Status Detection**
- **UP**: HTTP status codes 200-499
- **DOWN**: HTTP status codes 500+ or connection failures
- **Response Time**: Measured in milliseconds

#### **Incident Management**
- **Automatic detection** of downtime events
- **Incident logging** with start/end times
- **Root cause analysis** with error details
- **Recovery tracking** and MTTR calculation

### **Analytics Dashboard**

![Analytics Dashboard](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=center)

Access detailed analytics by clicking "Analytics" in the navigation:

- **Uptime trends** over time
- **Response time analysis** with percentiles
- **Incident history** and patterns
- **Performance comparisons** across websites
- **Custom date ranges** for historical analysis

---

## 📊 Analytics & AI

### **Performance Analytics**

#### **Uptime Metrics**
- **30-day uptime percentage** for each website
- **Historical trends** with interactive charts
- **Comparison views** across multiple websites
- **SLA compliance** tracking and reporting

#### **Response Time Analysis**
- **Average response times** with trend analysis
- **Performance distribution** with percentile breakdowns
- **Geographic performance** from multiple monitoring locations
- **Performance alerts** for degradation detection

### **AI-Powered Predictions** *(Professional & Enterprise)*

![AI Predictions](https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop&crop=center)

#### **Outage Prediction**
- **Risk assessment**: Low, Medium, High, Critical
- **Prediction confidence**: 0-100% accuracy score
- **Time windows**: Next hour, 6 hours, 24 hours, week
- **Contributing factors**: Performance trends, historical patterns

#### **Performance Forecasting**
- **Response time trends**: Improving, stable, degrading
- **Capacity planning**: Resource utilization predictions
- **Seasonal patterns**: Traffic and performance cycles
- **Anomaly detection**: Unusual behavior identification

#### **Intelligent Recommendations**
- **Proactive maintenance**: Suggested actions before issues occur
- **Performance optimization**: Configuration and infrastructure advice
- **Risk mitigation**: Steps to reduce outage probability
- **Best practices**: Industry-standard recommendations

#### **AI Analysis Features**
```javascript
// Example AI prediction output
{
  "riskLevel": "medium",
  "predictionConfidence": 85,
  "predictedOutageWindow": {
    "likelihood": 65,
    "timeframe": "next_24_hours"
  },
  "keyRiskFactors": [
    {
      "factor": "Response Time Degradation",
      "severity": "high",
      "description": "Response times increased 40% over last 48 hours"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Check server resources and database performance",
      "reasoning": "Gradual response time increase suggests resource constraints"
    }
  ],
  "healthScore": 72
}
```

---

## 💳 Subscription Plans

### **Plan Comparison**

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Websites** | 3 | 10 | 50 | 200 |
| **Check Frequency** | 5 minutes | 1 minute | 30 seconds | 15 seconds |
| **History** | 7 days | 30 days | 90 days | Unlimited |
| **Alerts** | Basic | Email | Email + SMS | All types |
| **Analytics** | Basic | Standard | Advanced | Full |
| **AI Predictions** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Support** | Community | Email | Priority | Dedicated |
| **Price** | $0 | $9/month | $29/month | $99/month |

### **Plan Features**

#### **Free Plan**
Perfect for personal projects and small websites:
- Monitor up to 3 websites
- 5-minute check intervals
- Basic email alerts
- 7-day data retention
- Community support

#### **Starter Plan** - *Most Popular*
Great for small businesses:
- Monitor up to 10 websites
- 1-minute check intervals
- Email notifications
- 30-day data retention
- Basic analytics dashboard
- Email support

#### **Professional Plan**
For growing companies with critical services:
- Monitor up to 50 websites
- 30-second check intervals
- Email + SMS alerts
- 90-day data retention
- Advanced analytics
- **AI-powered predictions**
- API access
- Priority support

#### **Enterprise Plan**
For large organizations:
- Monitor up to 200 websites
- 15-second check intervals
- All notification types
- Unlimited data retention
- Full analytics suite
- **Advanced AI features**
- Full API access
- Dedicated support manager
- Custom integrations

---

## 🔐 Authentication

### **User Management**

#### **Registration Process**
1. **Sign up** with email and password
2. **Email verification** (optional, configurable)
3. **14-day free trial** automatically activated
4. **Plan selection** and payment processing

#### **Authentication Features**
- **JWT-based authentication** with secure token management
- **Password reset** via email with secure tokens
- **Session management** with automatic token refresh
- **Rate limiting** to prevent brute force attacks

#### **Security Measures**
- **Password hashing** with bcrypt (12 rounds)
- **Input validation** and sanitization
- **CORS protection** with configurable origins
- **Helmet.js** for security headers
- **Rate limiting** on authentication endpoints

### **Password Reset Flow**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Email

    User->>Frontend: Request password reset
    Frontend->>Backend: POST /api/auth/forgot-password
    Backend->>Email: Send reset link
    Email->>User: Reset email with token
    User->>Frontend: Click reset link
    Frontend->>Backend: POST /api/auth/reset-password
    Backend->>Frontend: Password updated
    Frontend->>User: Success message
```

---

## 📡 API Reference

### **Authentication Endpoints**

#### **Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### **Website Management**

#### **Get All Websites**
```http
GET /api/websites
Authorization: Bearer <token>
```

#### **Add Website**
```http
POST /api/websites
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Website",
  "url": "https://example.com"
}
```

#### **Update Website**
```http
PUT /api/websites/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "url": "https://newurl.com",
  "isActive": true
}
```

#### **Delete Website**
```http
DELETE /api/websites/:id
Authorization: Bearer <token>
```

### **Analytics Endpoints**

#### **Get Analytics Data**
```http
GET /api/analytics?website=all&range=7d
Authorization: Bearer <token>
```

#### **Get Website Statistics**
```http
GET /api/websites/:id/stats
Authorization: Bearer <token>
```

### **AI Prediction Endpoints** *(Professional & Enterprise)*

#### **Get AI Prediction**
```http
GET /api/ai-prediction/website/:id
Authorization: Bearer <token>
```

#### **Trigger AI Analysis**
```http
POST /api/ai-prediction/analyze/:id
Authorization: Bearer <token>
```

### **Subscription Endpoints**

#### **Get Current Subscription**
```http
GET /api/subscription/current
Authorization: Bearer <token>
```

#### **Create Checkout Session**
```http
POST /api/subscription/create-checkout-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "planType": "professional",
  "duration": "monthly"
}
```

---

## 🧪 Testing

### **Running Tests**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### **Test Structure**

```
tests/
├── unit/
│   ├── auth.test.js
│   ├── websites.test.js
│   └── analytics.test.js
├── integration/
│   ├── api.test.js
│   └── monitoring.test.js
└── e2e/
    ├── user-flow.test.js
    └── monitoring-flow.test.js
```

### **Testing Guidelines**

- **Unit tests** for individual functions and components
- **Integration tests** for API endpoints and database operations
- **End-to-end tests** for complete user workflows
- **Monitoring tests** for uptime check accuracy

---

## 🚀 Deployment

### **Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
    volumes:
      - ./data:/app/data
```

### **Cloud Deployment**

#### **Vercel (Recommended for Frontend)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### **Railway (Recommended for Full Stack)**
```bash
# Connect to Railway
railway login
railway link

# Deploy
railway up
```

#### **DigitalOcean App Platform**
```yaml
# .do/app.yaml
name: uptime-monitor
services:
- name: web
  source_dir: /
  github:
    repo: yourusername/uptime-monitor
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
```

### **Environment Variables for Production**

```env
# Production Environment
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db"
FRONTEND_URL="https://yourdomain.com"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
GEMINI_API_KEY="your_production_key"
JWT_SECRET="your-production-jwt-secret"
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**
```bash
# Reset database
rm -f prisma/dev.db
npm run db:push

# Check database schema
npm run db:studio
```

#### **Monitoring Not Working**
```bash
# Check server logs
npm run server

# Verify website URLs are accessible
curl -I https://your-website.com
```

#### **Stripe Webhook Issues**
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3001/api/subscription/webhook
```

#### **AI Predictions Not Working**
- Verify Gemini API key is valid
- Check if user has Professional/Enterprise plan
- Ensure sufficient historical data exists

### **Debug Mode**

```bash
# Enable debug logging
DEBUG=uptime-monitor:* npm run dev

# Check monitoring logs
tail -f logs/monitoring.log
```

### **Performance Optimization**

#### **Database Optimization**
```sql
-- Add indexes for better performance
CREATE INDEX idx_uptime_checks_website_timestamp ON uptime_checks(websiteId, timestamp);
CREATE INDEX idx_downtime_logs_website_start ON downtime_logs(websiteId, startTime);
```

#### **Memory Usage**
```bash
# Monitor memory usage
node --max-old-space-size=4096 server/index.js
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### **Development Setup**

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/uptime-monitor.git
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes**
5. **Test thoroughly**
   ```bash
   npm test
   npm run lint
   ```
6. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push and create PR**

### **Contribution Guidelines**

- **Code Style**: Follow ESLint configuration
- **Testing**: Add tests for new features
- **Documentation**: Update README and API docs
- **Commits**: Use conventional commit format
- **Issues**: Use provided templates

### **Development Commands**

```bash
# Development
npm run dev          # Start dev servers
npm run server       # Backend only
npm run client       # Frontend only

# Database
npm run db:push      # Apply schema changes
npm run db:studio    # Open database GUI
npm run db:reset     # Reset database

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run type-check   # TypeScript checking
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 UptimeMonitor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Prisma** for the excellent ORM
- **Stripe** for secure payment processing
- **Google** for the Gemini AI API
- **Vercel** for hosting and deployment
- **All contributors** who help improve this project

---

## 📞 Support

- **Documentation**: [docs.uptimemonitor.com](https://docs.uptimemonitor.com)
- **Community**: [Discord Server](https://discord.gg/uptimemonitor)
- **Issues**: [GitHub Issues](https://github.com/yourusername/uptime-monitor/issues)
- **Email**: support@uptimemonitor.com

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by the UptimeMonitor team

[🌟 Star](https://github.com/yourusername/uptime-monitor) • [🐛 Report Bug](https://github.com/yourusername/uptime-monitor/issues) • [💡 Request Feature](https://github.com/yourusername/uptime-monitor/issues)

</div>