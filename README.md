# Uptime Monitor

A simple yet powerful uptime monitoring tool built with React and Node.js. Monitor your websites' availability, track response times, and get detailed uptime statistics.

## Features

- **Real-time Monitoring**: Automatic checks based on your subscription plan (15 seconds to 5 minutes)
- **Website Management**: Add, edit, delete, and pause monitoring
- **Uptime Statistics**: 30-day uptime percentages and incident tracking
- **Response Time Tracking**: Monitor website performance
- **Subscription Plans**: Free, Starter, Professional, and Enterprise plans
- **Stripe Integration**: Secure payment processing
- **Clean Dashboard**: Modern UI with real-time updates
- **Downtime Logging**: Detailed logs of all incidents
- **Plan-based Limits**: Website limits and check intervals based on subscription

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: SQLite with Prisma ORM
- **Monitoring**: Cron jobs with Axios

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Stripe keys and other configuration.

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development servers:
   ```bash
   npm run dev
   ```

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:3001

## Stripe Integration

This application uses Stripe for payment processing. To set up Stripe:

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe dashboard
3. Add the keys to your `.env` file
4. Create products in Stripe for each plan (Starter, Professional, Enterprise)
5. Set up webhooks to handle subscription events

### Webhook Setup

1. In your Stripe dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/subscription/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the webhook secret to your `.env` file

## Usage

1. **Add Websites**: Click "Add Website" to start monitoring a new URL
2. **View Status**: The dashboard shows real-time status of all monitored sites
3. **Manage Sites**: Edit or delete websites using the menu on each card
4. **Monitor Stats**: View uptime percentages, response times, and incident counts
5. **Upgrade Plans**: Access pricing modal to upgrade your subscription
6. **Plan Limits**: Websites are automatically managed based on your plan limits

## Database Schema

- **Websites**: Store website information and current status
- **Downtime Logs**: Track all downtime incidents with start/end times
- **Users**: Store user accounts with subscription information
- **Uptime Checks**: Historical check data for analytics

## API Endpoints

### Websites
- `GET /api/websites` - Get all websites with stats
- `POST /api/websites` - Add new website
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website
- `GET /api/websites/:id/stats` - Get detailed statistics

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile

### Subscriptions
- `GET /api/subscription/plans` - Get available plans
- `GET /api/subscription/current` - Get current subscription
- `POST /api/subscription/create-checkout-session` - Create Stripe checkout
- `POST /api/subscription/handle-success` - Handle successful payment
- `POST /api/subscription/upgrade` - Upgrade/downgrade plan
- `POST /api/subscription/cancel` - Cancel subscription
- `POST /api/subscription/webhook` - Stripe webhook handler
- `GET /api/subscription/usage` - Get usage statistics

### Analytics
- `GET /api/analytics` - Get analytics data with filtering

## Monitoring Logic

- Checks run every minute via cron job, but websites are checked based on their plan's check interval
- Websites with 5xx status codes are considered "down"
- Response times are measured for performance tracking
- Downtime incidents are automatically logged and closed
- Plan limits are enforced automatically
- Inactive websites are not monitored

## Plan Features

- **Free**: 3 websites, 5-minute checks, basic alerts
- **Starter**: 10 websites, 1-minute checks, email alerts
- **Professional**: 50 websites, 30-second checks, SMS + email alerts
- **Enterprise**: 200 websites, 15-second checks, all features

## Development

- `npm run server` - Start backend only
- `npm run client` - Start frontend only  
- `npm run db:studio` - Open Prisma Studio for database management

## License

MIT License