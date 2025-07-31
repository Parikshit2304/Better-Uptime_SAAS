const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const prisma = new PrismaClient();
const { JWT_SECRET } = require('../middleware/auth');

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' }
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: { error: 'Too many password reset attempts, please try again later.' }
});

// Email configuration (you'll need to configure this with your email service)
const transporter = nodemailer.createTransport({
  // Configure with your email service Gmail
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// Register
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with trial plan
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        subscriptionStatus: 'trial',
        planType: 'free',
        maxWebsites: 3,
        maxCheckInterval: 300,
        planEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        planType: user.planType,
        maxWebsites: user.maxWebsites
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        planType: user.planType,
        maxWebsites: user.maxWebsites,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot Password
router.post('/forgot-password', resetLimiter, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send email (configure your email service)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@uptimemonitor.com',
        to: email,
        subject: 'Password Reset Request',
        html: `
<div style="
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 30px;
  background: #f9fafb;
  font-family: 'Segoe UI', Roboto, Arial, sans-serif;
  color: #1f2937;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
">

  <!-- Header with Fallback Gradient Effect -->
  <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 16px auto;">
    <tr>
      <td align="center">
        <h1 style="
          font-size: 32px;
          font-weight: 800;
          margin: 0;
          text-align: center;
          font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        ">
          <span style="color: #3b82f6;">Uptime</span><span style="color: #a855f7;">Monitor</span>
        </h1>
      </td>
    </tr>
  </table>

  <!-- Subtitle -->
  <h2 style="
    font-size: 26px;
    font-weight: 700;
    color: #111827;
    text-align: center;
    margin-bottom: 12px;
    margin-top: 0;
  ">
    Password Reset Requested
  </h2>

  <!-- Description -->
  <p style="
    font-size: 16px;
    color: #4b5563;
    text-align: center;
    margin-bottom: 24px;
    margin-top: 0;
  ">
    You recently requested to reset your password. Click the button below to continue.
  </p>

  <!-- Reset Button -->
  <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
    <tr>
      <td align="center" bgcolor="#3b82f6" style="border-radius: 9999px; background: linear-gradient(to right, #3b82f6, #6366f1);">
        <a href="${resetUrl}" style="
          display: inline-block;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-radius: 9999px;
          font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        ">
          Reset Password
        </a>
      </td>
    </tr>
  </table>

  <!-- Expiry Info -->
  <p style="
    font-size: 14px;
    color: #6b7280;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 0;
  ">
    This link will expire in <strong>1 hour</strong>.
  </p>

  <!-- Footer -->
  <p style="
    font-size: 13px;
    color: #9ca3af;
    text-align: center;
    margin-top: 24px;
    margin-bottom: 0;
  ">
    If you didn’t request this, you can safely ignore this email.<br/>
    &copy; Uptime Monitor. All rights reserved.
  </p>
</div>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue anyway - don't reveal email sending issues
    }

    res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('token').exists(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get user profile
router.get('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        planType: true,
        maxWebsites: true,
        maxCheckInterval: true,
        planStartDate: true,
        planEndDate: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;