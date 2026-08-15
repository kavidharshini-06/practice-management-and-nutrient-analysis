const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ayurvedic_dietitian_practice_management_key';

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields' });
    }

    if (!['admin', 'dietitian', 'patient'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    // Check if email already exists
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const insertRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, role, phone || null]
    );

    const newUser = insertRes.rows[0];

    // If role is patient, initialize patients table row
    if (role === 'patient') {
      await db.query(
        'INSERT INTO patients (user_id, date_of_birth, gender, height, weight, bmi, activity_level) VALUES ($1, null, null, 0, 0, 0, null)',
        [newUser.id]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Search user
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];

    // Validate password
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Simulation of password recovery
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User with this email does not exist' });
    }

    // Generate a mock reset token
    return res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been simulated. Check console log.',
      resetToken: 'mock-jwt-token-for-reset-purposes-only-12345'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset request' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRes.rows[0];
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};
