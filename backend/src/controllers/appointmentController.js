const db = require('../config/db');

exports.getAllAppointments = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let queryText = `
      SELECT a.*, p_u.name as patient_name, p_u.email as patient_email, p_u.phone as patient_phone, d_u.name as dietitian_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users p_u ON p.user_id = p_u.id
      LEFT JOIN users d_u ON a.dietitian_id = d_u.id
    `;
    const params = [];

    if (role === 'dietitian') {
      queryText += ' WHERE a.dietitian_id = $1';
      params.push(userId);
    } else if (role === 'patient') {
      queryText += ' WHERE p.user_id = $1';
      params.push(userId);
    }
    // Admin sees all

    queryText += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';
    const appointmentsRes = await db.query(queryText, params);

    return res.status(200).json({ success: true, data: appointmentsRes.rows });
  } catch (error) {
    console.error('Get appointments error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving appointments' });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const dietitianId = req.user.role === 'dietitian' ? req.user.id : (req.body.dietitian_id || null);
    const { patient_id, appointment_date, appointment_time, appointment_type, reason, notes } = req.body;

    if (!patient_id || !appointment_date || !appointment_time || !appointment_type) {
      return res.status(400).json({ success: false, message: 'Patient, date, time, and appointment type are required' });
    }

    const insertRes = await db.query(
      `INSERT INTO appointments (patient_id, dietitian_id, appointment_date, appointment_time, appointment_type, status, reason, notes)
       VALUES ($1, $2, $3, $4, $5, 'Scheduled', $6, $7)
       RETURNING id`,
      [patient_id, dietitianId, appointment_date, appointment_time, appointment_type, reason || null, notes || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      appointmentId: insertRes.rows[0].id
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ success: false, message: 'Server error scheduling appointment' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    const { appointment_date, appointment_time, appointment_type, status, reason, notes } = req.body;

    // Check if appointment exists
    const checkRes = await db.query('SELECT dietitian_id, patient_id FROM appointments WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const appt = checkRes.rows[0];

    // Access control
    if (role === 'dietitian' && appt.dietitian_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    } else if (role === 'patient') {
      const patCheck = await db.query('SELECT user_id FROM patients WHERE id = $1', [appt.patient_id]);
      if (patCheck.rows.length === 0 || patCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    await db.query(
      `UPDATE appointments SET
        appointment_date = COALESCE($1, appointment_date),
        appointment_time = COALESCE($2, appointment_time),
        appointment_type = COALESCE($3, appointment_type),
        status = COALESCE($4, status),
        reason = COALESCE($5, reason),
        notes = COALESCE($6, notes)
       WHERE id = $7`,
      [appointment_date, appointment_time, appointment_type, status, reason, notes, id]
    );

    return res.status(200).json({ success: true, message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Update appointment error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating appointment' });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const checkRes = await db.query('SELECT dietitian_id FROM appointments WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (role === 'dietitian' && checkRes.rows[0].dietitian_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await db.query('DELETE FROM appointments WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting appointment' });
  }
};
