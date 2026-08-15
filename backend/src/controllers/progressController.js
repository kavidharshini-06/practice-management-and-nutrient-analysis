const db = require('../config/db');

exports.getProgressByPatientId = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { patientId } = req.params;

    // Check if patientId is valid or if patient is fetching their own progress
    let patientDbId = patientId;

    if (role === 'patient') {
      const patientCheck = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
      if (patientCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Patient profile not found' });
      }
      patientDbId = patientCheck.rows[0].id;
    }

    const progressRes = await db.query(
      'SELECT * FROM progress_records WHERE patient_id = $1 ORDER BY record_date ASC',
      [patientDbId]
    );

    return res.status(200).json({ success: true, data: progressRes.rows });
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving progress history' });
  }
};

exports.createProgressRecord = async (req, res) => {
  try {
    const { patient_id, record_date, weight, water_intake, exercise, adherence, notes } = req.body;

    if (!patient_id || !record_date || !weight) {
      return res.status(400).json({ success: false, message: 'Patient, date, and weight are required' });
    }

    // Fetch patient height to calculate BMI
    const patientRes = await db.query('SELECT height FROM patients WHERE id = $1', [patient_id]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const height = parseFloat(patientRes.rows[0].height || patientRes.rows[0].HEIGHT || 0);
    let bmiVal = 0;
    if (height > 0) {
      const heightInMeters = height / 100;
      bmiVal = parseFloat((parseFloat(weight) / (heightInMeters * heightInMeters)).toFixed(1));
    }

    const insertRes = await db.query(
      `INSERT INTO progress_records (patient_id, record_date, weight, bmi, water_intake, exercise, adherence, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [patient_id, record_date, parseFloat(weight), bmiVal, parseFloat(water_intake || 0), exercise || null, adherence || null, notes || null]
    );

    // Update patient's current weight and BMI in patients table too
    await db.query(
      'UPDATE patients SET weight = $1, bmi = $2 WHERE id = $3',
      [parseFloat(weight), bmiVal, patient_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Progress record logged successfully',
      recordId: insertRes.rows[0].id
    });
  } catch (error) {
    console.error('Create progress record error:', error);
    return res.status(500).json({ success: false, message: 'Server error logging progress record' });
  }
};
