const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getSystemStats = async (req, res) => {
  try {
    const patientsCountRes = await db.query('SELECT COUNT(*) as count FROM patients');
    const dietitiansCountRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'dietitian'");
    const appointmentsCountRes = await db.query('SELECT COUNT(*) as count FROM appointments');
    const dietPlansCountRes = await db.query("SELECT COUNT(*) as count FROM diet_plans WHERE status = 'Active'");
    const consultationsCountRes = await db.query('SELECT COUNT(*) as count FROM consultations');
    const foodsCountRes = await db.query('SELECT COUNT(*) as count FROM foods');

    const stats = {
      totalPatients: parseInt(patientsCountRes.rows[0].count || patientsCountRes.rows[0].COUNT || 0),
      totalDietitians: parseInt(dietitiansCountRes.rows[0].count || dietitiansCountRes.rows[0].COUNT || 0),
      totalAppointments: parseInt(appointmentsCountRes.rows[0].count || appointmentsCountRes.rows[0].COUNT || 0),
      activeDietPlans: parseInt(dietPlansCountRes.rows[0].count || dietPlansCountRes.rows[0].COUNT || 0),
      completedConsultations: parseInt(consultationsCountRes.rows[0].count || consultationsCountRes.rows[0].COUNT || 0),
      foodDatabaseCount: parseInt(foodsCountRes.rows[0].count || foodsCountRes.rows[0].COUNT || 0)
    };

    // Aggregate Patient Growth data in JS (database-agnostic)
    const patientGrowthRes = await db.query('SELECT created_at FROM patients');
    const growthMap = {};
    patientGrowthRes.rows.forEach(p => {
      const dateVal = p.created_at || p.CREATED_AT;
      if (dateVal) {
        const d = new Date(dateVal);
        const monthName = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        growthMap[monthName] = (growthMap[monthName] || 0) + 1;
      }
    });
    
    // Convert to sorted array
    const patientGrowth = Object.keys(growthMap).map(month => ({
      name: month,
      count: growthMap[month]
    }));

    // Aggregate Appointments by Status
    const appointmentsRes = await db.query('SELECT status, appointment_date FROM appointments');
    const statusMap = { Scheduled: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    const dateMap = {};

    appointmentsRes.rows.forEach(a => {
      const status = a.status || a.STATUS || 'Scheduled';
      statusMap[status] = (statusMap[status] || 0) + 1;

      const dateVal = a.appointment_date || a.APPOINTMENT_DATE;
      if (dateVal) {
        const d = new Date(dateVal);
        const dateStr = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
      }
    });

    const appointmentStatusStats = Object.keys(statusMap).map(status => ({
      name: status,
      value: statusMap[status]
    }));

    const appointmentTimeline = Object.keys(dateMap).slice(0, 10).map(date => ({
      name: date,
      appointments: dateMap[date]
    }));

    // Diet plan statuses
    const dietPlanRes = await db.query('SELECT status FROM diet_plans');
    const planStatusMap = { Active: 0, Completed: 0, Suspended: 0 };
    dietPlanRes.rows.forEach(dp => {
      const status = dp.status || dp.STATUS || 'Active';
      planStatusMap[status] = (planStatusMap[status] || 0) + 1;
    });
    const dietPlanStats = Object.keys(planStatusMap).map(status => ({
      name: status,
      value: planStatusMap[status]
    }));

    // Ayurvedic Prakriti distribution of patients
    const prakritiRes = await db.query('SELECT prakriti FROM ayurvedic_profiles');
    const prakritiMap = {};
    prakritiRes.rows.forEach(ap => {
      const prak = ap.prakriti || ap.PRAKRITI || 'Vata';
      prakritiMap[prak] = (prakritiMap[prak] || 0) + 1;
    });
    const prakritiStats = Object.keys(prakritiMap).map(p => ({
      name: p,
      value: prakritiMap[p]
    }));

    return res.status(200).json({
      success: true,
      stats,
      charts: {
        patientGrowth,
        appointmentStatusStats,
        appointmentTimeline,
        dietPlanStats,
        prakritiStats
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating system analytics' });
  }
};

exports.getDietitians = async (req, res) => {
  try {
    const dietitiansRes = await db.query(
      "SELECT id, name, email, phone, created_at FROM users WHERE role = 'dietitian' ORDER BY name ASC"
    );
    return res.status(200).json({ success: true, data: dietitiansRes.rows });
  } catch (error) {
    console.error('Get dietitians error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving dietitian list' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const usersRes = await db.query(
      'SELECT id, name, email, role, phone, created_at FROM users ORDER BY role ASC, name ASC'
    );
    return res.status(200).json({ success: true, data: usersRes.rows });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving system user directory' });
  }
};

exports.createDietitian = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const checkRes = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    await db.query(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, 'dietitian', $4)",
      [name.trim(), email.toLowerCase().trim(), passwordHash, phone || null]
    );

    return res.status(201).json({ success: true, message: 'Dietitian account created successfully' });
  } catch (error) {
    console.error('Create dietitian error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating dietitian account' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    // Access control: Non-admins can only update their own profile details
    if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update your own profile details' });
    }

    const checkRes = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await db.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), role = COALESCE($4, role), updated_at = CURRENT_TIMESTAMP WHERE id = $5',
      [name, email ? email.toLowerCase().trim() : null, phone, role, id]
    );

    return res.status(200).json({ success: true, message: 'User details updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating user record' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check user exists
    const checkRes = await db.query('SELECT role FROM users WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (checkRes.rows[0].role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin accounts cannot be deleted' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
};
