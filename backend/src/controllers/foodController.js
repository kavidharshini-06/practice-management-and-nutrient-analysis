const db = require('../config/db');

exports.getAllFoods = async (req, res) => {
  try {
    const { search, category, dosha } = req.query;
    let queryText = 'SELECT * FROM foods WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND LOWER(name) LIKE $${paramIndex}`;
      params.push(`%${search.toLowerCase().trim()}%`);
      paramIndex++;
    }

    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (dosha) {
      // In PostgreSQL, search check or like
      queryText += ` AND (LOWER(dosha_effect) LIKE $${paramIndex} OR LOWER(benefits) LIKE $${paramIndex})`;
      params.push(`%${dosha.toLowerCase().trim()}%`);
      paramIndex++;
    }

    queryText += ' ORDER BY name ASC';
    const foodsRes = await db.query(queryText, params);

    return res.status(200).json({ success: true, data: foodsRes.rows });
  } catch (error) {
    console.error('Get foods error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving food list' });
  }
};

exports.getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const foodRes = await db.query('SELECT * FROM foods WHERE id = $1', [id]);
    
    if (foodRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    return res.status(200).json({ success: true, data: foodRes.rows[0] });
  } catch (error) {
    console.error('Get food by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving food item' });
  }
};

exports.createFood = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'dietitian') {
      return res.status(403).json({ success: false, message: 'Unauthorized permission' });
    }

    const {
      name, category, serving_size,
      calories, protein, carbohydrates, fat, fiber, sugar, sodium,
      calcium, iron, potassium, vitamin_a, vitamin_c, vitamin_d, vitamin_b12,
      rasa, guna, virya, vipaka, dosha_effect, benefits, cautions
    } = req.body;

    if (!name || !category || !serving_size) {
      return res.status(400).json({ success: false, message: 'Name, Category, and Serving Size are required fields' });
    }

    const insertRes = await db.query(
      `INSERT INTO foods (
        name, category, serving_size,
        calories, protein, carbohydrates, fat, fiber, sugar, sodium,
        calcium, iron, potassium, vitamin_a, vitamin_c, vitamin_d, vitamin_b12,
        rasa, guna, virya, vipaka, dosha_effect, benefits, cautions
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING id`,
      [
        name, category, serving_size,
        parseFloat(calories || 0), parseFloat(protein || 0), parseFloat(carbohydrates || 0),
        parseFloat(fat || 0), parseFloat(fiber || 0), parseFloat(sugar || 0), parseFloat(sodium || 0),
        parseFloat(calcium || 0), parseFloat(iron || 0), parseFloat(potassium || 0),
        parseFloat(vitamin_a || 0), parseFloat(vitamin_c || 0), parseFloat(vitamin_d || 0), parseFloat(vitamin_b12 || 0),
        rasa || null, guna || null, virya || null, vipaka || null, dosha_effect || null, benefits || null, cautions || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Food item added successfully to database',
      foodId: insertRes.rows[0].id
    });
  } catch (error) {
    console.error('Create food error:', error);
    return res.status(500).json({ success: false, message: 'Server error adding food item' });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'dietitian') {
      return res.status(403).json({ success: false, message: 'Unauthorized permission' });
    }

    const { id } = req.params;
    const {
      name, category, serving_size,
      calories, protein, carbohydrates, fat, fiber, sugar, sodium,
      calcium, iron, potassium, vitamin_a, vitamin_c, vitamin_d, vitamin_b12,
      rasa, guna, virya, vipaka, dosha_effect, benefits, cautions
    } = req.body;

    const checkRes = await db.query('SELECT id FROM foods WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    await db.query(
      `UPDATE foods SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        serving_size = COALESCE($3, serving_size),
        calories = COALESCE($4, calories),
        protein = COALESCE($5, protein),
        carbohydrates = COALESCE($6, carbohydrates),
        fat = COALESCE($7, fat),
        fiber = COALESCE($8, fiber),
        sugar = COALESCE($9, sugar),
        sodium = COALESCE($10, sodium),
        calcium = COALESCE($11, calcium),
        iron = COALESCE($12, iron),
        potassium = COALESCE($13, potassium),
        vitamin_a = COALESCE($14, vitamin_a),
        vitamin_c = COALESCE($15, vitamin_c),
        vitamin_d = COALESCE($16, vitamin_d),
        vitamin_b12 = COALESCE($17, vitamin_b12),
        rasa = COALESCE($18, rasa),
        guna = COALESCE($19, guna),
        virya = COALESCE($20, virya),
        vipaka = COALESCE($21, vipaka),
        dosha_effect = COALESCE($22, dosha_effect),
        benefits = COALESCE($23, benefits),
        cautions = COALESCE($24, cautions)
       WHERE id = $25`,
      [
        name, category, serving_size,
        calories !== undefined ? parseFloat(calories) : null,
        protein !== undefined ? parseFloat(protein) : null,
        carbohydrates !== undefined ? parseFloat(carbohydrates) : null,
        fat !== undefined ? parseFloat(fat) : null,
        fiber !== undefined ? parseFloat(fiber) : null,
        sugar !== undefined ? parseFloat(sugar) : null,
        sodium !== undefined ? parseFloat(sodium) : null,
        calcium !== undefined ? parseFloat(calcium) : null,
        iron !== undefined ? parseFloat(iron) : null,
        potassium !== undefined ? parseFloat(potassium) : null,
        vitamin_a !== undefined ? parseFloat(vitamin_a) : null,
        vitamin_c !== undefined ? parseFloat(vitamin_c) : null,
        vitamin_d !== undefined ? parseFloat(vitamin_d) : null,
        vitamin_b12 !== undefined ? parseFloat(vitamin_b12) : null,
        rasa, guna, virya, vipaka, dosha_effect, benefits, cautions,
        id
      ]
    );

    return res.status(200).json({ success: true, message: 'Food item updated successfully' });
  } catch (error) {
    console.error('Update food error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating food item' });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'dietitian') {
      return res.status(403).json({ success: false, message: 'Unauthorized permission' });
    }

    const { id } = req.params;
    const checkRes = await db.query('SELECT id FROM foods WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    await db.query('DELETE FROM foods WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Delete food error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting food item. It might be in use inside a meal.' });
  }
};
