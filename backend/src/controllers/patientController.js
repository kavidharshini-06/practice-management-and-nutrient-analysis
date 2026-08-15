const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper to calculate BMI
function calculateBMI(weight, height) {
  if (!weight || !height || height === 0) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

exports.getAllPatients = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let queryText = `
      SELECT p.*, u.name, u.email, u.phone, ap.prakriti
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN ayurvedic_profiles ap ON p.id = ap.patient_id
    `;
    const params = [];

    if (role === 'dietitian') {
      queryText += ' WHERE p.dietitian_id = $1';
      params.push(userId);
    } else if (role === 'patient') {
      queryText += ' WHERE p.user_id = $1';
      params.push(userId);
    }
    // Admin gets all patients

    queryText += ' ORDER BY u.name ASC';
    const patientsRes = await db.query(queryText, params);

    return res.status(200).json({ success: true, data: patientsRes.rows });
  } catch (error) {
    console.error('Get patients error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving patients' });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const patientRes = await db.query(
      `SELECT p.*, u.name, u.email, u.phone, 
              ap.prakriti, ap.rasa_preference, ap.lifestyle_notes, ap.sleep_duration, ap.exercise_level, ap.stress_level, ap.water_intake
       FROM patients p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN ayurvedic_profiles ap ON p.id = ap.patient_id
       WHERE p.id = $1`,
      [id]
    );

    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const patient = patientRes.rows[0];

    // Access control check
    if (role === 'dietitian' && patient.dietitian_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this patient record' });
    } else if (role === 'patient' && patient.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to your record' });
    }

    return res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error('Get patient by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving patient' });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const dietitianId = req.user.role === 'dietitian' ? req.user.id : (req.body.dietitian_id || null);
    const {
      name, email, password, phone,
      date_of_birth, gender, height, weight, activity_level,
      allergies, dietary_restrictions, health_goal, current_diet, lifestyle_info,
      prakriti, rasa_preference, lifestyle_notes, sleep_duration, exercise_level, stress_level, water_intake
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required fields' });
    }

    // Check email uniqueness
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Default password is password123 if not provided
    const userPass = password || 'password123';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(userPass, salt);

    // Create User record
    const userInsert = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, 'patient', $4)
       RETURNING id`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, phone || null]
    );
    const newUserId = userInsert.rows[0].id;

    // Calculate BMI
    const bmiVal = calculateBMI(parseFloat(weight || 0), parseFloat(height || 0));

    // Create Patient record
    const patientInsert = await db.query(
      `INSERT INTO patients (user_id, dietitian_id, date_of_birth, gender, height, weight, bmi, activity_level, allergies, dietary_restrictions, health_goal, current_diet, lifestyle_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        newUserId, dietitianId, date_of_birth || null, gender || null, 
        height ? parseFloat(height) : 0, weight ? parseFloat(weight) : 0, bmiVal,
        activity_level || null, allergies || null, dietary_restrictions || null, 
        health_goal || null, current_diet || null, lifestyle_info || null
      ]
    );
    const newPatientId = patientInsert.rows[0].id;

    // Create Ayurvedic Profile if provided (or default Vata)
    const prakritiVal = prakriti || 'Vata';
    await db.query(
      `INSERT INTO ayurvedic_profiles (patient_id, prakriti, rasa_preference, lifestyle_notes, sleep_duration, exercise_level, stress_level, water_intake)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        newPatientId, prakritiVal, rasa_preference || null, lifestyle_notes || null,
        sleep_duration ? parseFloat(sleep_duration) : 7.0, exercise_level || null,
        stress_level || null, water_intake ? parseFloat(water_intake) : 2.0
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: { patientId: newPatientId, userId: newUserId }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating patient record' });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params; // Patient ID
    const { role, id: userId } = req.user;
    
    // Check if patient exists
    const checkPatient = await db.query('SELECT user_id, dietitian_id FROM patients WHERE id = $1', [id]);
    if (checkPatient.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const patientData = checkPatient.rows[0];

    // Access control check
    if (role === 'dietitian' && patientData.dietitian_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    } else if (role === 'patient' && patientData.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const {
      name, phone,
      date_of_birth, gender, height, weight, activity_level,
      allergies, dietary_restrictions, health_goal, current_diet, lifestyle_info,
      prakriti, rasa_preference, lifestyle_notes, sleep_duration, exercise_level, stress_level, water_intake
    } = req.body;

    const bmiVal = calculateBMI(parseFloat(weight || 0), parseFloat(height || 0));

    // Update User Info
    await db.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [name, phone, patientData.user_id]
    );

    // Update Patient Info
    await db.query(
      `UPDATE patients 
       SET date_of_birth = COALESCE($1, date_of_birth), 
           gender = COALESCE($2, gender), 
           height = COALESCE($3, height), 
           weight = COALESCE($4, weight), 
           bmi = $5,
           activity_level = COALESCE($6, activity_level), 
           allergies = COALESCE($7, allergies), 
           dietary_restrictions = COALESCE($8, dietary_restrictions), 
           health_goal = COALESCE($9, health_goal),
           current_diet = COALESCE($10, current_diet),
           lifestyle_info = COALESCE($11, lifestyle_info),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12`,
      [
        date_of_birth, gender, height ? parseFloat(height) : 0, weight ? parseFloat(weight) : 0, bmiVal,
        activity_level, allergies, dietary_restrictions, health_goal, current_diet, lifestyle_info,
        id
      ]
    );

    // Update or Insert Ayurvedic Profile
    const profileCheck = await db.query('SELECT id FROM ayurvedic_profiles WHERE patient_id = $1', [id]);
    if (profileCheck.rows.length === 0) {
      await db.query(
        `INSERT INTO ayurvedic_profiles (patient_id, prakriti, rasa_preference, lifestyle_notes, sleep_duration, exercise_level, stress_level, water_intake)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id, prakriti || 'Vata', rasa_preference, lifestyle_notes,
          sleep_duration ? parseFloat(sleep_duration) : 7.0, exercise_level,
          stress_level, water_intake ? parseFloat(water_intake) : 2.0
        ]
      );
    } else {
      await db.query(
        `UPDATE ayurvedic_profiles 
         SET prakriti = COALESCE($1, prakriti), 
             rasa_preference = COALESCE($2, rasa_preference), 
             lifestyle_notes = COALESCE($3, lifestyle_notes), 
             sleep_duration = COALESCE($4, sleep_duration), 
             exercise_level = COALESCE($5, exercise_level), 
             stress_level = COALESCE($6, stress_level), 
             water_intake = COALESCE($7, water_intake),
             updated_at = CURRENT_TIMESTAMP
         WHERE patient_id = $8`,
        [
          prakriti, rasa_preference, lifestyle_notes,
          sleep_duration ? parseFloat(sleep_duration) : null, exercise_level,
          stress_level, water_intake ? parseFloat(water_intake) : null,
          id
        ]
      );
    }

    return res.status(200).json({ success: true, message: 'Patient profile updated successfully' });
  } catch (error) {
    console.error('Update patient error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating patient record' });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== 'admin' && role !== 'dietitian') {
      return res.status(403).json({ success: false, message: 'Unauthorized permission' });
    }

    const patientRes = await db.query('SELECT user_id FROM patients WHERE id = $1', [id]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    const userId = patientRes.rows[0].user_id;

    // Delete user (cascade will delete patients, ayurvedic_profiles, etc. if PostgreSQL schema constraints set properly)
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    return res.status(200).json({ success: true, message: 'Patient record deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting patient record' });
  }
};
