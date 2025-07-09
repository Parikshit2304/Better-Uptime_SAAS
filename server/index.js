const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Import routes
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const { authenticateToken, checkSubscriptionLimits } = require('./middleware/auth');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs:  60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Get all websites
app.get('/api/websites', authenticateToken, async (req, res) => {
  try {
    const websites = await prisma.website.findMany({
      where: { userId: req.user.id },
      include: {
        downtimeLogs: {
          orderBy: { startTime: 'desc' },
          take: 5
        },
        uptimeChecks: {
          orderBy: { timestamp: 'desc' },
          take: 30
        }
      }
    });

    // Calculate uptime statistics for each website
    const websitesWithStats = await Promise.all(websites.map(async (website) => {
      const stats = await calculateUptimeStats(website.id);
      return {
        ...website,
        ...stats
      };
    }));

    res.json(websitesWithStats);
  } catch (error) {
    console.error('Error fetching websites:', error);
    res.status(500).json({ error: 'Failed to fetch websites' });
  }
});

// Add new website
app.post('/api/websites', authenticateToken, checkSubscriptionLimits, async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const website = await prisma.website.create({
      data: { 
        name: name.trim(), 
        url: url.trim(),
        userId: req.user.id
      }
    });

    res.status(201).json(website);
  } catch (error) {
    console.error('Error creating website:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'URL already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create website' });
    }
  }
});

// Update website
app.put('/api/websites/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, isActive } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if website belongs to user
    const existingWebsite = await prisma.website.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingWebsite) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const website = await prisma.website.update({
      where: { id, userId: req.user.id },
      data: { 
        name: name.trim(), 
        url: url.trim(), 
        isActive: isActive !== undefined ? isActive : true 
      }
    });

    res.json(website);
  } catch (error) {
    console.error('Error updating website:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Website not found' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'URL already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update website' });
    }
  }
});

// Delete website
app.delete('/api/websites/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if website belongs to user
    const existingWebsite = await prisma.website.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingWebsite) {
      return res.status(404).json({ error: 'Website not found' });
    }
    
    await prisma.website.delete({
      where: { id, userId: req.user.id }
    });

    res.json({ message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Error deleting website:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Website not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete website' });
    }
  }
});

// Get website statistics
app.get('/api/websites/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if website belongs to user
    const website = await prisma.website.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }
    
    const stats = await calculateUptimeStats(id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Helper function to calculate uptime statistics
async function calculateUptimeStats(websiteId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const downtimeLogs = await prisma.downtimeLog.findMany({
    where: {
      websiteId,
      startTime: { gte: thirtyDaysAgo }
    }
  });

  let totalDowntime = 0;
  downtimeLogs.forEach(log => {
    const endTime = log.endTime || now;
    const downtime = endTime.getTime() - log.startTime.getTime();
    totalDowntime += downtime;
  });

  const totalTime = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  const uptime = totalTime - totalDowntime;
  const uptimePercentage = (uptime / totalTime) * 100;

  return {
    uptimePercentage: Math.max(0, Math.min(100, uptimePercentage)),
    totalDowntime: totalDowntime,
    downtimeCount: downtimeLogs.length
  };
}

// Monitoring function
async function checkWebsite(website) {
  try {
    console.log(`Checking ${website.name} (${website.url})`);
    const startTime = Date.now();
    
    const response = await axios.get(website.url, {
      timeout: 30000, // 30 seconds timeout
      validateStatus: (status) => status < 500, // Consider 4xx as "up" but 5xx as "down"
      headers: {
        'User-Agent': 'Uptime-Monitor/1.0'
      },
      maxRedirects: 5
    });
    
    const responseTime = Date.now() - startTime;
    const isUp = response.status < 500;

    // Update website status
    await prisma.website.update({
      where: { id: website.id },
      data: {
        status: isUp ? 'up' : 'down',
        lastChecked: new Date(),
        responseTime: responseTime
      }
    });

    // Store uptime check data
    await prisma.uptimeCheck.create({
      data: {
        websiteId: website.id,
        status: isUp ? 'up' : 'down',
        responseTime: responseTime,
        timestamp: new Date()
      }
    });

    // Handle downtime logging
    if (!isUp) {
      await handleDowntime(website.id, `HTTP ${response.status}`);
    } else {
      await handleUptime(website.id);
    }

    console.log(`✓ ${website.name}: ${isUp ? 'UP' : 'DOWN'} (${responseTime}ms)`);

  } catch (error) {
    console.error(`✗ ${website.name}: ERROR - ${error.message}`);
    
    // Update website status to down
    await prisma.website.update({
      where: { id: website.id },
      data: {
        status: 'down',
        lastChecked: new Date(),
        responseTime: null
      }
    });

    // Store uptime check data
    await prisma.uptimeCheck.create({
      data: {
        websiteId: website.id,
        status: 'down',
        responseTime: null,
        timestamp: new Date()
      }
    });

    await handleDowntime(website.id, error.message);
  }
}

async function handleDowntime(websiteId, reason) {
  try {
    // Check if there's an ongoing downtime log
    const ongoingDowntime = await prisma.downtimeLog.findFirst({
      where: {
        websiteId,
        endTime: null
      }
    });

    // If no ongoing downtime, create a new log
    if (!ongoingDowntime) {
      await prisma.downtimeLog.create({
        data: {
          websiteId,
          startTime: new Date(),
          reason: reason?.substring(0, 500) // Limit reason length
        }
      });

      await prisma.website.update({
        where: { id: websiteId },
        data: { lastDowntime: new Date() }
      });
    }
  } catch (error) {
    console.error('Error handling downtime:', error);
  }
}

async function handleUptime(websiteId) {
  try {
    // Close any ongoing downtime logs
    const ongoingDowntime = await prisma.downtimeLog.findFirst({
      where: {
        websiteId,
        endTime: null
      }
    });

    if (ongoingDowntime) {
      await prisma.downtimeLog.update({
        where: { id: ongoingDowntime.id },
        data: { endTime: new Date() }
      });
    }
  } catch (error) {
    console.error('Error handling uptime:', error);
  }
}

// Monitor all active websites every minute
cron.schedule('* * * * *', async () => {
  try {
    console.log(`\n[${new Date().toISOString()}] Starting monitoring cycle...`);
    
    // Get all active websites with user subscription info
    const activeWebsites = await prisma.website.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            maxCheckInterval: true,
            subscriptionStatus: true,
            planEndDate: true,
            planType: true
          }
        }
      }
    });

    console.log(`Found ${activeWebsites.length} active websites`);

    // Filter websites based on check interval, subscription status, and plan limits
    const websitesToCheck = activeWebsites.filter(website => {
      const user = website.user;
      
      // Skip if subscription expired (except for free plan)
      if (user.planType !== 'free' && user.planEndDate && new Date() > user.planEndDate) {
        console.log(`Skipping ${website.name} - subscription expired`);
        return false;
      }
      
      // Skip if subscription is not active (except for free and trial)
      if (!['active', 'trial'].includes(user.subscriptionStatus) && user.planType !== 'free') {
        console.log(`Skipping ${website.name} - subscription not active: ${user.subscriptionStatus}`);
        return false;
      }
      
      // Check if it's time to check this website based on user's plan
      const lastChecked = website.lastChecked ? new Date(website.lastChecked) : new Date(0);
      const timeSinceLastCheck = (new Date() - lastChecked) / 1000; // in seconds
      
      const shouldCheck = timeSinceLastCheck >= user.maxCheckInterval;
      
      if (!shouldCheck) {
        const remainingTime = user.maxCheckInterval - timeSinceLastCheck;
        console.log(`Skipping ${website.name} - next check in ${Math.round(remainingTime)}s (plan: ${user.planType}, interval: ${user.maxCheckInterval}s)`);
      }
      
      return shouldCheck;
    });

    console.log(`Monitoring ${websitesToCheck.length} websites this cycle`);

    // Check websites in parallel but with some delay to avoid overwhelming
    const promises = websitesToCheck.map((website, index) => {
      return new Promise(resolve => {
        setTimeout(() => {
          console.log(`Checking ${website.name} (${website.user.planType} plan, ${website.user.maxCheckInterval}s interval)`);
          checkWebsite(website).finally(resolve);
        }, index * 500); // 500ms delay between each check
      });
    });

    await Promise.all(promises);
    console.log(`Monitoring cycle completed - checked ${websitesToCheck.length} websites\n`);
  } catch (error) {
    console.error('Error in monitoring cron job:', error);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Monitoring service started - checking websites every minute');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});