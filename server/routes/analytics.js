const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get analytics data
router.get('/', async (req, res) => {
  try {
    const { website = 'all', range = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build website filter
    const websiteFilter = website === 'all' ? {} : { websiteId: website };

    // Get all websites for the filter
    const websites = await prisma.website.findMany({
      where: website === 'all' ? {} : { id: website },
      include: {
        downtimeLogs: {
          where: {
            startTime: { gte: startDate }
          }
        },
        uptimeChecks: {
          where: {
            timestamp: { gte: startDate }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    // Calculate overview metrics
    const overview = await calculateOverviewMetrics(websites, startDate, now);
    
    // Get historical data
    const uptimeHistory = await getUptimeHistory(websites, startDate, now, range);
    const responseTimeHistory = await getResponseTimeHistory(websites, startDate, now, range);
    const incidentHistory = await getIncidentHistory(websiteFilter, startDate);
    
    // Calculate status distribution
    const statusDistribution = calculateStatusDistribution(websites);
    
    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(websites);

    res.json({
      overview,
      uptimeHistory,
      responseTimeHistory,
      incidentHistory,
      statusDistribution,
      performanceMetrics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Helper functions
async function calculateOverviewMetrics(websites, startDate, endDate) {
  let totalUptime = 0;
  let totalResponseTime = 0;
  let totalIncidents = 0;
  let totalChecks = 0;
  let totalDowntime = 0;

  for (const website of websites) {
    // Calculate uptime for this website
    const checks = website.uptimeChecks || [];
    const upChecks = checks.filter(check => check.status === 'up').length;
    const websiteUptime = checks.length > 0 ? (upChecks / checks.length) * 100 : 0;
    
    totalUptime += websiteUptime;
    totalChecks += checks.length;
    
    // Calculate average response time
    const responseTimes = checks.filter(check => check.responseTime).map(check => check.responseTime);
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      totalResponseTime += avgResponseTime;
    }
    
    // Count incidents
    totalIncidents += website.downtimeLogs.length;
    
    // Calculate total downtime
    website.downtimeLogs.forEach(log => {
      const endTime = log.endTime || endDate;
      const downtime = endTime.getTime() - log.startTime.getTime();
      totalDowntime += downtime;
    });
  }

  const avgUptime = websites.length > 0 ? totalUptime / websites.length : 0;
  const avgResponseTime = websites.length > 0 ? totalResponseTime / websites.length : 0;
  const mttr = totalIncidents > 0 ? (totalDowntime / totalIncidents) / (1000 * 60) : 0; // in minutes

  // Calculate trends (simplified - comparing with previous period)
  const uptimeTrend = Math.random() * 2 - 1; // Placeholder
  const responseTimeTrend = Math.random() * 20 - 10; // Placeholder
  const incidentTrend = Math.floor(Math.random() * 5) - 2; // Placeholder

  return {
    avgUptime,
    avgResponseTime,
    totalIncidents,
    mttr: Math.round(mttr),
    uptimeTrend,
    responseTimeTrend,
    incidentTrend
  };
}

async function getUptimeHistory(websites, startDate, endDate, range) {
  const history = [];
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    
    let dayUptime = 0;
    let websiteCount = 0;
    
    for (const website of websites) {
      const dayChecks = website.uptimeChecks.filter(check => 
        check.timestamp >= date && check.timestamp < nextDate
      );
      
      if (dayChecks.length > 0) {
        const upChecks = dayChecks.filter(check => check.status === 'up').length;
        const websiteUptime = (upChecks / dayChecks.length) * 100;
        dayUptime += websiteUptime;
        websiteCount++;
      }
    }
    
    const avgUptime = websiteCount > 0 ? dayUptime / websiteCount : 100;
    
    history.push({
      date: date.toISOString(),
      uptime: Math.round(avgUptime * 10) / 10
    });
  }
  
  return history;
}

async function getResponseTimeHistory(websites, startDate, endDate, range) {
  const history = [];
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    
    let totalResponseTime = 0;
    let checkCount = 0;
    
    for (const website of websites) {
      const dayChecks = website.uptimeChecks.filter(check => 
        check.timestamp >= date && check.timestamp < nextDate && check.responseTime
      );
      
      dayChecks.forEach(check => {
        totalResponseTime += check.responseTime;
        checkCount++;
      });
    }
    
    const avgResponseTime = checkCount > 0 ? totalResponseTime / checkCount : 0;
    
    history.push({
      date: date.toISOString(),
      avgResponseTime: Math.round(avgResponseTime)
    });
  }
  
  return history;
}

async function getIncidentHistory(websiteFilter, startDate) {
  const incidents = await prisma.downtimeLog.findMany({
    where: {
      ...websiteFilter,
      startTime: { gte: startDate }
    },
    include: {
      website: true
    },
    orderBy: { startTime: 'desc' },
    take: 20
  });

  return incidents.map(incident => {
    const duration = incident.endTime 
      ? Math.round((incident.endTime.getTime() - incident.startTime.getTime()) / (1000 * 60))
      : Math.round((new Date().getTime() - incident.startTime.getTime()) / (1000 * 60));

    return {
      websiteName: incident.website.name,
      startTime: incident.startTime,
      endTime: incident.endTime,
      duration,
      reason: incident.reason || 'Unknown error'
    };
  });
}

function calculateStatusDistribution(websites) {
  const distribution = { up: 0, down: 0, unknown: 0 };
  
  websites.forEach(website => {
    if (website.status === 'up') distribution.up++;
    else if (website.status === 'down') distribution.down++;
    else distribution.unknown++;
  });
  
  return distribution;
}

function calculatePerformanceMetrics(websites) {
  let bestUptime = 0;
  let worstUptime = 100;
  let fastestResponse = Infinity;
  let slowestResponse = 0;
  
  websites.forEach(website => {
    const checks = website.uptimeChecks || [];
    
    if (checks.length > 0) {
      const upChecks = checks.filter(check => check.status === 'up').length;
      const uptime = (upChecks / checks.length) * 100;
      
      bestUptime = Math.max(bestUptime, uptime);
      worstUptime = Math.min(worstUptime, uptime);
      
      const responseTimes = checks.filter(check => check.responseTime).map(check => check.responseTime);
      if (responseTimes.length > 0) {
        const minResponse = Math.min(...responseTimes);
        const maxResponse = Math.max(...responseTimes);
        
        fastestResponse = Math.min(fastestResponse, minResponse);
        slowestResponse = Math.max(slowestResponse, maxResponse);
      }
    }
  });
  
  return {
    bestUptime: bestUptime || 0,
    worstUptime: worstUptime === 100 ? 0 : worstUptime,
    fastestResponse: fastestResponse === Infinity ? 0 : fastestResponse,
    slowestResponse
  };
}

module.exports = router;