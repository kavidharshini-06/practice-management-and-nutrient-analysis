const db = require('../config/db');

// Helper to parse serving size numerical value (e.g. '100g' -> 100, '200ml' -> 200, '10g' -> 10)
function parseServingSize(servingSize) {
  if (!servingSize) return 100;
  const num = parseFloat(servingSize.replace(/[^0-9.]/g, ''));
  return isNaN(num) || num === 0 ? 100 : num;
}

exports.getAllDietPlans = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let queryText = `
      SELECT dp.*, p_u.name as patient_name, d_u.name as dietitian_name
      FROM diet_plans dp
      JOIN patients p ON dp.patient_id = p.id
      JOIN users p_u ON p.user_id = p_u.id
      LEFT JOIN users d_u ON dp.dietitian_id = d_u.id
    `;
    const params = [];

    if (role === 'dietitian') {
      queryText += ' WHERE dp.dietitian_id = $1';
      params.push(userId);
    } else if (role === 'patient') {
      queryText += ' WHERE p.user_id = $1';
      params.push(userId);
    }
    // Admin gets all

    queryText += ' ORDER BY dp.created_at DESC';
    const plansRes = await db.query(queryText, params);

    return res.status(200).json({ success: true, data: plansRes.rows });
  } catch (error) {
    console.error('Get diet plans error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving diet plans' });
  }
};

exports.getDietPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    // Get core diet plan details
    const planRes = await db.query(
      `SELECT dp.*, p_u.name as patient_name, p_u.phone as patient_phone, p_u.email as patient_email,
              p.date_of_birth, p.gender, p.height, p.weight, p.bmi,
              ap.prakriti, ap.rasa_preference, ap.lifestyle_notes,
              d_u.name as dietitian_name
       FROM diet_plans dp
       JOIN patients p ON dp.patient_id = p.id
       JOIN users p_u ON p.user_id = p_u.id
       LEFT JOIN ayurvedic_profiles ap ON p.id = ap.patient_id
       LEFT JOIN users d_u ON dp.dietitian_id = d_u.id
       WHERE dp.id = $1`,
      [id]
    );

    if (planRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    const plan = planRes.rows[0];

    // Check permissions
    if (role === 'dietitian' && plan.dietitian_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    } else if (role === 'patient') {
      // Need to check if patient user ID matches
      const patCheck = await db.query('SELECT user_id FROM patients WHERE id = $1', [plan.patient_id]);
      if (patCheck.rows.length === 0 || patCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    // Fetch meals and meal items for this plan
    const mealsRes = await db.query(
      `SELECT m.id as meal_id, m.meal_date, m.meal_type, m.notes as meal_notes,
              mi.id as item_id, mi.food_id, mi.quantity, mi.calories, mi.protein, mi.carbohydrates, mi.fat, mi.fiber,
              f.name as food_name, f.category as food_category, f.serving_size, f.rasa, f.guna, f.virya, f.vipaka, f.dosha_effect, f.benefits, f.cautions
       FROM meals m
       LEFT JOIN meal_items mi ON m.id = mi.meal_id
       LEFT JOIN foods f ON mi.food_id = f.id
       WHERE m.diet_plan_id = $1
       ORDER BY m.meal_date ASC, 
         CASE m.meal_type
           WHEN 'Early Morning' THEN 1
           WHEN 'Breakfast' THEN 2
           WHEN 'Mid-Morning' THEN 3
           WHEN 'Lunch' THEN 4
           WHEN 'Evening Snack' THEN 5
           WHEN 'Dinner' THEN 6
           WHEN 'Bedtime' THEN 7
           ELSE 8
         END ASC`,
      [id]
    );

    // Group meals by date and type
    const mealsMap = {};
    mealsRes.rows.forEach(row => {
      const dateKey = row.meal_date || row.MEAL_DATE;
      const typeKey = row.meal_type || row.MEAL_TYPE;
      const mealId = row.meal_id || row.MEAL_ID;

      if (!mealsMap[mealId]) {
        mealsMap[mealId] = {
          id: mealId,
          date: dateKey,
          type: typeKey,
          notes: row.meal_notes || row.MEAL_NOTES || '',
          items: []
        };
      }

      if (row.item_id || row.ITEM_ID) {
        mealsMap[mealId].items.push({
          id: row.item_id || row.ITEM_ID,
          food_id: row.food_id || row.FOOD_ID,
          food_name: row.food_name || row.FOOD_NAME,
          category: row.food_category || row.FOOD_CATEGORY,
          serving_size: row.serving_size || row.SERVING_SIZE,
          quantity: parseFloat(row.quantity || row.QUANTITY || 0),
          calories: parseFloat(row.calories || row.CALORIES || 0),
          protein: parseFloat(row.protein || row.PROTEIN || 0),
          carbohydrates: parseFloat(row.carbohydrates || row.CARBOHYDRATES || 0),
          fat: parseFloat(row.fat || row.FAT || 0),
          fiber: parseFloat(row.fiber || row.FIBER || 0),
          rasa: row.rasa || row.RASA,
          guna: row.guna || row.GUNA,
          virya: row.virya || row.VIRYA,
          vipaka: row.vipaka || row.VIPAKA,
          dosha_effect: row.dosha_effect || row.DOSHA_EFFECT,
          benefits: row.benefits || row.BENEFITS,
          cautions: row.cautions || row.CAUTIONS
        });
      }
    });

    plan.meals = Object.values(mealsMap);

    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    console.error('Get diet plan by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving diet plan' });
  }
};

exports.createDietPlan = async (req, res) => {
  try {
    const dietitianId = req.user.role === 'dietitian' ? req.user.id : (req.body.dietitian_id || null);
    const { patient_id, start_date, end_date, health_goal, notes, meals } = req.body;

    if (!patient_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Patient, start date, and end date are required' });
    }

    // 1. Insert core diet plan
    const planRes = await db.query(
      `INSERT INTO diet_plans (patient_id, dietitian_id, start_date, end_date, health_goal, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active')
       RETURNING id`,
      [patient_id, dietitianId, start_date, end_date, health_goal || null, notes || null]
    );
    const planId = planRes.rows[0].id;

    // 2. Insert meals and meal items if provided
    if (meals && Array.isArray(meals)) {
      for (const meal of meals) {
        const { date, type, notes: mealNotes, items } = meal;
        if (!date || !type) continue;

        const mealRes = await db.query(
          `INSERT INTO meals (diet_plan_id, meal_date, meal_type, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [planId, date, type, mealNotes || null]
        );
        const mealId = mealRes.rows[0].id;

        if (items && Array.isArray(items)) {
          for (const item of items) {
            const { food_id, quantity } = item;
            if (!food_id || !quantity || parseFloat(quantity) <= 0) continue;

            // Fetch food properties to calculate nutrients
            const foodRes = await db.query('SELECT * FROM foods WHERE id = $1', [food_id]);
            if (foodRes.rows.length === 0) continue;
            
            const food = foodRes.rows[0];
            const servingNum = parseServingSize(food.serving_size || food.SERVING_SIZE);
            const scale = parseFloat(quantity) / servingNum;

            const caloriesVal = parseFloat((food.calories || food.CALORIES || 0)) * scale;
            const proteinVal = parseFloat((food.protein || food.PROTEIN || 0)) * scale;
            const carbsVal = parseFloat((food.carbohydrates || food.CARBOHYDRATES || 0)) * scale;
            const fatVal = parseFloat((food.fat || food.FAT || 0)) * scale;
            const fiberVal = parseFloat((food.fiber || food.FIBER || 0)) * scale;

            await db.query(
              `INSERT INTO meal_items (meal_id, food_id, quantity, calories, protein, carbohydrates, fat, fiber)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [mealId, food_id, parseFloat(quantity), caloriesVal, proteinVal, carbsVal, fatVal, fiberVal]
            );
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Diet plan created successfully',
      data: { planId }
    });
  } catch (error) {
    console.error('Create diet plan error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating diet plan' });
  }
};

exports.updateDietPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    const { start_date, end_date, health_goal, notes, status, meals } = req.body;

    // Check if diet plan exists
    const checkRes = await db.query('SELECT dietitian_id FROM diet_plans WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (role === 'dietitian' && checkRes.rows[0].dietitian_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this plan' });
    }

    // Update Core Diet Plan
    await db.query(
      `UPDATE diet_plans 
       SET start_date = COALESCE($1, start_date), 
           end_date = COALESCE($2, end_date), 
           health_goal = COALESCE($3, health_goal), 
           notes = COALESCE($4, notes), 
           status = COALESCE($5, status)
       WHERE id = $6`,
      [start_date, end_date, health_goal, notes, status, id]
    );

    // If meals array is provided, let's clear the old meals and items and re-insert
    if (meals && Array.isArray(meals)) {
      // Deleting meals cascades and deletes meal_items in PostgreSQL
      await db.query('DELETE FROM meals WHERE diet_plan_id = $1', [id]);

      for (const meal of meals) {
        const { date, type, notes: mealNotes, items } = meal;
        if (!date || !type) continue;

        const mealRes = await db.query(
          `INSERT INTO meals (diet_plan_id, meal_date, meal_type, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [id, date, type, mealNotes || null]
        );
        const mealId = mealRes.rows[0].id;

        if (items && Array.isArray(items)) {
          for (const item of items) {
            const { food_id, quantity } = item;
            if (!food_id || !quantity || parseFloat(quantity) <= 0) continue;

            // Fetch food properties
            const foodRes = await db.query('SELECT * FROM foods WHERE id = $1', [food_id]);
            if (foodRes.rows.length === 0) continue;
            
            const food = foodRes.rows[0];
            const servingNum = parseServingSize(food.serving_size || food.SERVING_SIZE);
            const scale = parseFloat(quantity) / servingNum;

            const caloriesVal = parseFloat((food.calories || food.CALORIES || 0)) * scale;
            const proteinVal = parseFloat((food.protein || food.PROTEIN || 0)) * scale;
            const carbsVal = parseFloat((food.carbohydrates || food.CARBOHYDRATES || 0)) * scale;
            const fatVal = parseFloat((food.fat || food.FAT || 0)) * scale;
            const fiberVal = parseFloat((food.fiber || food.FIBER || 0)) * scale;

            await db.query(
              `INSERT INTO meal_items (meal_id, food_id, quantity, calories, protein, carbohydrates, fat, fiber)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [mealId, food_id, parseFloat(quantity), caloriesVal, proteinVal, carbsVal, fatVal, fiberVal]
            );
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Diet plan updated successfully' });
  } catch (error) {
    console.error('Update diet plan error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating diet plan' });
  }
};

exports.deleteDietPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const checkRes = await db.query('SELECT dietitian_id FROM diet_plans WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (role === 'dietitian' && checkRes.rows[0].dietitian_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await db.query('DELETE FROM diet_plans WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Diet plan deleted successfully' });
  } catch (error) {
    console.error('Delete diet plan error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting diet plan' });
  }
};
