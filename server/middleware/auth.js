const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        planType: true,
        maxWebsites: true,
        maxCheckInterval: true,
        planEndDate: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if subscription is expired
    if (user.planEndDate && new Date() > user.planEndDate && user.planType !== 'free') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'expired',
          planType: 'free',
          maxWebsites: 3,
          maxCheckInterval: 300
        }
      });
      user.subscriptionStatus = 'expired';
      user.planType = 'free';
      user.maxWebsites = 3;
      user.maxCheckInterval = 300;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const checkSubscriptionLimits = async (req, res, next) => {
  try {
    const user = req.user;
    const websiteCount = await prisma.website.count({
      where: { 
        userId: user.id,
        isActive: true
      }
    });

    if (websiteCount >= user.maxWebsites) {
      return res.status(403).json({ 
        error: 'Website limit reached',
        message: `You have reached the limit of ${user.maxWebsites} websites for your ${user.planType} plan. Please upgrade to add more websites.`,
        limit: user.maxWebsites,
        current: websiteCount,
        planType: user.planType
      });
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Failed to check subscription limits' });
  }
};

const enforceWebsiteLimits = async (userId, maxWebsites) => {
  try {
    // Get all websites for the user
    const websites = await prisma.website.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // If user has more websites than allowed, deactivate the excess
    if (websites.length > maxWebsites) {
      const websitesToDeactivate = websites.slice(maxWebsites);
      
      await prisma.website.updateMany({
        where: {
          id: { in: websitesToDeactivate.map(w => w.id) }
        },
        data: { isActive: false }
      });

      return {
        deactivated: websitesToDeactivate.length,
        remaining: maxWebsites
      };
    }

    return { deactivated: 0, remaining: websites.length };
  } catch (error) {
    console.error('Error enforcing website limits:', error);
    throw error;
  }
};
module.exports = {
  authenticateToken,
  checkSubscriptionLimits,
  enforceWebsiteLimits,
  JWT_SECRET
};