const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const aiPredictionService = require('../services/aiPrediction');

const router = express.Router();
const prisma = new PrismaClient();

// Get AI prediction for a specific website
router.get('/website/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if website belongs to user and user has required plan
    const website = await prisma.website.findFirst({
      where: { 
        id, 
        userId: req.user.id 
      },
      include: {
        user: {
          select: { planType: true }
        }
      }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    if (!['professional', 'enterprise'].includes(website.user.planType)) {
      return res.status(403).json({ 
        error: 'AI predictions are only available for Professional and Enterprise plans',
        requiredPlan: 'professional'
      });
    }

    const prediction = await aiPredictionService.getPrediction(id);
    
    if (!prediction) {
      return res.status(404).json({ error: 'No prediction available. Analysis may still be in progress.' });
    }

    res.json({ prediction });
  } catch (error) {
    console.error('Error fetching AI prediction:', error);
    res.status(500).json({ error: 'Failed to fetch AI prediction' });
  }
});

// Trigger AI analysis for a specific website
router.post('/analyze/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if website belongs to user and user has required plan
    const website = await prisma.website.findFirst({
      where: { 
        id, 
        userId: req.user.id 
      },
      include: {
        user: {
          select: { planType: true }
        }
      }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    if (!['professional', 'enterprise'].includes(website.user.planType)) {
      return res.status(403).json({ 
        error: 'AI predictions are only available for Professional and Enterprise plans',
        requiredPlan: 'professional'
      });
    }

    // Trigger analysis (async)
    aiPredictionService.analyzeWebsiteHealth(id)
      .then(() => console.log(`AI analysis completed for website ${id}`))
      .catch(error => console.error(`AI analysis failed for website ${id}:`, error));

    res.json({ message: 'AI analysis started. Results will be available shortly.' });
  } catch (error) {
    console.error('Error triggering AI analysis:', error);
    res.status(500).json({ error: 'Failed to trigger AI analysis' });
  }
});

// Get all predictions for user's websites
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    if (!['professional', 'enterprise'].includes(req.user.planType)) {
      return res.status(403).json({ 
        error: 'AI predictions are only available for Professional and Enterprise plans',
        requiredPlan: 'professional'
      });
    }

    const websites = await prisma.website.findMany({
      where: { userId: req.user.id },
      include: {
        aiPredictions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const predictions = websites.map(website => {
      const latestPrediction = website.aiPredictions[0];
      return {
        websiteId: website.id,
        websiteName: website.name,
        websiteUrl: website.url,
        prediction: latestPrediction ? {
          ...latestPrediction,
          predictedOutageWindow: JSON.parse(latestPrediction.predictedOutageWindow),
          keyRiskFactors: JSON.parse(latestPrediction.keyRiskFactors),
          performanceTrends: JSON.parse(latestPrediction.performanceTrends),
          recommendations: JSON.parse(latestPrediction.recommendations)
        } : null
      };
    });

    res.json({ predictions });
  } catch (error) {
    console.error('Error fetching dashboard predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions dashboard' });
  }
});

// Get prediction history for a website
router.get('/history/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    
    // Check if website belongs to user
    const website = await prisma.website.findFirst({
      where: { 
        id, 
        userId: req.user.id 
      },
      include: {
        user: {
          select: { planType: true }
        }
      }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    if (!['professional', 'enterprise'].includes(website.user.planType)) {
      return res.status(403).json({ 
        error: 'AI predictions are only available for Professional and Enterprise plans'
      });
    }

    const predictions = await prisma.aIPrediction.findMany({
      where: { websiteId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    const formattedPredictions = predictions.map(prediction => ({
      ...prediction,
      predictedOutageWindow: JSON.parse(prediction.predictedOutageWindow),
      keyRiskFactors: JSON.parse(prediction.keyRiskFactors),
      performanceTrends: JSON.parse(prediction.performanceTrends),
      recommendations: JSON.parse(prediction.recommendations)
    }));

    res.json({ predictions: formattedPredictions });
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({ error: 'Failed to fetch prediction history' });
  }
});

module.exports = router;