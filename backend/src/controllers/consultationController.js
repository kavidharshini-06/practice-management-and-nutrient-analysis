const db = require('../config/db');

exports.getAllConsultations = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { patientId } = req.query;

    let queryText = `
      SELECT c.*, p_u.name as patient_name, d_u.name as dietitian_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      JOIN users p_u ON p.user_id = p_u.id
      LEFT JOIN users d_u ON c.dietitian_id = d_u.id
    `;
    const params = [];
    let paramIndex = 1;

    // Filters
    const conditions = [];

    if (patientId) {
      conditions.push(`c.patient_id = $${paramIndex}`);
      params.push(patientId);
      paramIndex++;
    } else if (role === 'patient') {
      conditions.push(`p.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (role === 'dietitian') {
      conditions.push(`c.dietitian_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY c.consultation_date DESC, c.created_at DESC';
    const consultationsRes = await db.query(queryText, params);

    return res.status(200).json({ success: true, data: consultationsRes.rows });
  } catch (error) {
    console.error('Get consultations error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving consultations history' });
  }
};

exports.createConsultation = async (req, res) => {
  try {
    const dietitianId = req.user.role === 'dietitian' ? req.user.id : (req.body.dietitian_id || null);
    const { patient_id, consultation_date, concerns, assessment, recommendations, follow_up_date, notes } = req.body;

    if (!patient_id || !consultation_date || !concerns || !assessment) {
      return res.status(400).json({ success: false, message: 'Patient, date, concerns, and assessment are required' });
    }

    const insertRes = await db.query(
      `INSERT INTO consultations (patient_id, dietitian_id, consultation_date, concerns, assessment, recommendations, follow_up_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [patient_id, dietitianId, consultation_date, concerns, assessment, recommendations || null, follow_up_date || null, notes || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Consultation recorded successfully',
      consultationId: insertRes.rows[0].id
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    return res.status(500).json({ success: false, message: 'Server error recording consultation' });
  }
};

exports.updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    const { consultation_date, concerns, assessment, recommendations, follow_up_date, notes } = req.body;

    // Check if consultation exists
    const checkRes = await db.query('SELECT dietitian_id FROM consultations WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    if (role === 'dietitian' && checkRes.rows[0].dietitian_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await db.query(
      `UPDATE consultations SET
        consultation_date = COALESCE($1, consultation_date),
        concerns = COALESCE($2, concerns),
        assessment = COALESCE($3, assessment),
        recommendations = COALESCE($4, recommendations),
        follow_up_date = COALESCE($5, follow_up_date),
        notes = COALESCE($6, notes)
       WHERE id = $7`,
      [consultation_date, concerns, assessment, recommendations, follow_up_date, notes, id]
    );

    return res.status(200).json({ success: true, message: 'Consultation record updated successfully' });
  } catch (error) {
    console.error('Update consultation error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating consultation record' });
  }
};
