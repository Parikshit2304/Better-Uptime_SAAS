const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIPredictionService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async analyzeWebsiteHealth(websiteId) {
    try {
      // Get comprehensive data for the website
      const website = await prisma.website.findUnique({
        where: { id: websiteId },
        include: {
          uptimeChecks: {
            orderBy: { timestamp: 'desc' },
            take: 1000 // Last 1000 checks for analysis
          },
          downtimeLogs: {
            orderBy: { startTime: 'desc' },
            take: 50 // Last 50 incidents
          },
          user: {
            select: {
              planType: true,
              maxCheckInterval: true
            }
          }
        }
      });

      if (!website || !['professional', 'enterprise'].includes(website.user.planType)) {
        return null;
      }

      // Prepare data for AI analysis
      const analysisData = this.prepareAnalysisData(website);
      
      // Generate AI prediction
      const prediction = await this.generatePrediction(analysisData);
      
      // Store prediction in database
      await this.storePrediction(websiteId, prediction);
      
      return prediction;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return null;
    }
  }

  prepareAnalysisData(website) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter checks by time periods
    const checks24h = website.uptimeChecks.filter(check => new Date(check.timestamp) >= last24h);
    const checks7d = website.uptimeChecks.filter(check => new Date(check.timestamp) >= last7d);
    const checks30d = website.uptimeChecks.filter(check => new Date(check.timestamp) >= last30d);

    // Calculate metrics
    const metrics = {
      website: {
        name: website.name,
        url: website.url,
        currentStatus: website.status,
        checkInterval: website.user.maxCheckInterval
      },
      performance: {
        last24h: this.calculatePeriodMetrics(checks24h),
        last7d: this.calculatePeriodMetrics(checks7d),
        last30d: this.calculatePeriodMetrics(checks30d)
      },
      incidents: website.downtimeLogs.map(log => ({
        startTime: log.startTime,
        endTime: log.endTime,
        duration: log.endTime ? 
          Math.round((new Date(log.endTime) - new Date(log.startTime)) / 1000 / 60) : 
          Math.round((now - new Date(log.startTime)) / 1000 / 60),
        reason: log.reason
      })),
      patterns: this.analyzePatterns(website.uptimeChecks, website.downtimeLogs)
    };

    return metrics;
  }

  calculatePeriodMetrics(checks) {
    if (checks.length === 0) {
      return {
        totalChecks: 0,
        upChecks: 0,
        downChecks: 0,
        uptimePercentage: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        responseTimeVariance: 0
      };
    }

    const upChecks = checks.filter(check => check.status === 'up');
    const downChecks = checks.filter(check => check.status === 'down');
    const responseTimes = checks.filter(check => check.responseTime).map(check => check.responseTime);

    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    const variance = responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length : 0;

    return {
      totalChecks: checks.length,
      upChecks: upChecks.length,
      downChecks: downChecks.length,
      uptimePercentage: (upChecks.length / checks.length) * 100,
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      responseTimeVariance: Math.round(variance)
    };
  }

  analyzePatterns(uptimeChecks, downtimeLogs) {
    // Analyze time-based patterns
    const hourlyPatterns = {};
    const dailyPatterns = {};
    
    uptimeChecks.forEach(check => {
      const date = new Date(check.timestamp);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      if (!hourlyPatterns[hour]) hourlyPatterns[hour] = { up: 0, down: 0 };
      if (!dailyPatterns[day]) dailyPatterns[day] = { up: 0, down: 0 };
      
      hourlyPatterns[hour][check.status]++;
      dailyPatterns[day][check.status]++;
    });

    // Find peak failure times
    const peakFailureHours = Object.entries(hourlyPatterns)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        failureRate: data.down / (data.up + data.down) || 0
      }))
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 3);

    // Analyze incident frequency trends
    const recentIncidents = downtimeLogs.slice(0, 10);
    const incidentFrequency = this.calculateIncidentFrequency(recentIncidents);

    return {
      peakFailureHours,
      incidentFrequency,
      totalIncidents: downtimeLogs.length,
      avgIncidentDuration: this.calculateAvgIncidentDuration(downtimeLogs)
    };
  }

  calculateIncidentFrequency(incidents) {
    if (incidents.length < 2) return 'insufficient_data';
    
    const intervals = [];
    for (let i = 0; i < incidents.length - 1; i++) {
      const current = new Date(incidents[i].startTime);
      const next = new Date(incidents[i + 1].startTime);
      intervals.push(current - next);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const days = avgInterval / (1000 * 60 * 60 * 24);
    
    if (days < 1) return 'very_high';
    if (days < 3) return 'high';
    if (days < 7) return 'moderate';
    if (days < 30) return 'low';
    return 'very_low';
  }

  calculateAvgIncidentDuration(incidents) {
    const completedIncidents = incidents.filter(incident => incident.endTime);
    if (completedIncidents.length === 0) return 0;
    
    const totalDuration = completedIncidents.reduce((sum, incident) => {
      return sum + (new Date(incident.endTime) - new Date(incident.startTime));
    }, 0);
    
    return Math.round(totalDuration / completedIncidents.length / 1000 / 60); // in minutes
  }

  async generatePrediction(analysisData) {
    const prompt = `
You are an expert system administrator and data analyst specializing in website uptime monitoring and predictive analytics. 

Analyze the following website monitoring data and provide a comprehensive prediction report:

WEBSITE DATA:
${JSON.stringify(analysisData, null, 2)}

Please provide a detailed analysis in the following JSON format:

{
  "riskLevel": "low|medium|high|critical",
  "predictionConfidence": 0-100,
  "predictedOutageWindow": {
    "likelihood": 0-100,
    "timeframe": "next_hour|next_6_hours|next_24_hours|next_week",
    "specificTime": "estimated time or null"
  },
  "keyRiskFactors": [
    {
      "factor": "factor name",
      "severity": "low|medium|high",
      "description": "detailed explanation"
    }
  ],
  "performanceTrends": {
    "responseTime": "improving|stable|degrading",
    "uptime": "improving|stable|degrading",
    "reliability": "improving|stable|degrading"
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "specific action to take",
      "reasoning": "why this action is recommended"
    }
  ],
  "healthScore": 0-100,
  "summary": "brief summary of overall website health and prediction"
}

Focus on:
1. Response time patterns and anomalies
2. Uptime trends across different time periods
3. Incident frequency and duration patterns
4. Time-based failure patterns (peak hours, days)
5. Performance degradation indicators
6. Predictive insights based on historical data

Be specific and actionable in your recommendations.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid JSON response from AI');
    } catch (error) {
      console.error('AI Prediction Error:', error);
      
      // Fallback prediction based on simple rules
      return this.generateFallbackPrediction(analysisData);
    }
  }

  generateFallbackPrediction(data) {
    const last24h = data.performance.last24h;
    const last7d = data.performance.last7d;
    
    let riskLevel = 'low';
    let healthScore = 85;
    
    // Simple rule-based prediction
    if (last24h.uptimePercentage < 95) {
      riskLevel = 'high';
      healthScore = 40;
    } else if (last24h.uptimePercentage < 98) {
      riskLevel = 'medium';
      healthScore = 65;
    }
    
    if (last24h.avgResponseTime > 5000) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      healthScore -= 20;
    }
    
    return {
      riskLevel,
      predictionConfidence: 70,
      predictedOutageWindow: {
        likelihood: riskLevel === 'high' ? 80 : riskLevel === 'medium' ? 40 : 15,
        timeframe: 'next_24_hours',
        specificTime: null
      },
      keyRiskFactors: [
        {
          factor: 'Response Time',
          severity: last24h.avgResponseTime > 3000 ? 'high' : 'low',
          description: `Average response time is ${last24h.avgResponseTime}ms`
        }
      ],
      performanceTrends: {
        responseTime: last24h.avgResponseTime > last7d.avgResponseTime ? 'degrading' : 'stable',
        uptime: last24h.uptimePercentage < last7d.uptimePercentage ? 'degrading' : 'stable',
        reliability: 'stable'
      },
      recommendations: [
        {
          priority: 'medium',
          action: 'Monitor response times closely',
          reasoning: 'Response time patterns indicate potential issues'
        }
      ],
      healthScore: Math.max(0, Math.min(100, healthScore)),
      summary: `Website health is ${riskLevel} risk with ${healthScore}% health score`
    };
  }

  async storePrediction(websiteId, prediction) {
    try {
      await prisma.aIPrediction.create({
        data: {
          websiteId,
          riskLevel: prediction.riskLevel,
          predictionConfidence: prediction.predictionConfidence,
          predictedOutageWindow: JSON.stringify(prediction.predictedOutageWindow),
          keyRiskFactors: JSON.stringify(prediction.keyRiskFactors),
          performanceTrends: JSON.stringify(prediction.performanceTrends),
          recommendations: JSON.stringify(prediction.recommendations),
          healthScore: prediction.healthScore,
          summary: prediction.summary,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error storing prediction:', error);
    }
  }

  async getPrediction(websiteId) {
    try {
      const prediction = await prisma.aIPrediction.findFirst({
        where: { websiteId },
        orderBy: { createdAt: 'desc' }
      });

      if (!prediction) return null;

      return {
        ...prediction,
        predictedOutageWindow: JSON.parse(prediction.predictedOutageWindow),
        keyRiskFactors: JSON.parse(prediction.keyRiskFactors),
        performanceTrends: JSON.parse(prediction.performanceTrends),
        recommendations: JSON.parse(prediction.recommendations)
      };
    } catch (error) {
      console.error('Error getting prediction:', error);
      return null;
    }
  }

  async runPredictionForAllWebsites() {
    try {
      const websites = await prisma.website.findMany({
        where: {
          isActive: true,
          user: {
            planType: {
              in: ['professional', 'enterprise']
            }
          }
        },
        include: {
          user: {
            select: { planType: true }
          }
        }
      });

      console.log(`Running AI predictions for ${websites.length} websites...`);

      for (const website of websites) {
        try {
          await this.analyzeWebsiteHealth(website.id);
          console.log(`✓ AI prediction completed for ${website.name}`);
        } catch (error) {
          console.error(`✗ AI prediction failed for ${website.name}:`, error.message);
        }
        
        // Add delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error running batch predictions:', error);
    }
  }
}

module.exports = new AIPredictionService();