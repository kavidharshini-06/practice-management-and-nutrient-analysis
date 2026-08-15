const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool = null;
let isJSONdb = false;
let dbData = null; // Memory storage for JSON DB fallback
const dbJsonPath = path.join(__dirname, '..', '..', 'database', 'db.json');

const dbUrl = process.env.DATABASE_URL;

if (dbUrl && dbUrl.trim() !== '') {
  console.log('🔌 Connecting to PostgreSQL Database in Cloud Mode...');
  pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('📦 No DATABASE_URL found. Falling back to local JSON database emulator...');
  isJSONdb = true;
  
  // Ensure database directory exists
  const dbDir = path.dirname(dbJsonPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing data or initialize
  if (fs.existsSync(dbJsonPath)) {
    try {
      dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
      console.log('✅ Loaded local JSON database successfully.');
    } catch (err) {
      console.error('❌ Failed to parse db.json, initializing empty:', err.message);
      initEmptyData();
    }
  } else {
    initEmptyData();
  }
}

function initEmptyData() {
  dbData = {
    users: [],
    patients: [],
    ayurvedic_profiles: [],
    foods: [],
    diet_plans: [],
    meals: [],
    meal_items: [],
    consultations: [],
    appointments: [],
    progress_records: []
  };
  saveJsonDb();
}

function saveJsonDb() {
  if (isJSONdb && dbData) {
    fs.writeFileSync(dbJsonPath, JSON.stringify(dbData, null, 2), 'utf8');
  }
}

// Unified query wrapper
function query(text, params = []) {
  if (!isJSONdb) {
    // PostgreSQL Query
    return pool.query(text, params);
  }

  // JSON Database SQL Query Emulator
  return new Promise((resolve, reject) => {
    try {
      const sql = text.trim();
      const upperSql = sql.toUpperCase();
      const normalizedSql = sql.replace(/\s+/g, ' ').trim().toUpperCase();
      
      // 1. SELECT 1 FROM users LIMIT 1
      if (normalizedSql.startsWith('SELECT 1 FROM USERS')) {
        return resolve({ rows: dbData.users.length > 0 ? [{ 1: 1 }] : [] });
      }

      // 2. SELECT COUNT(*) as count FROM <table>
      if (normalizedSql.startsWith('SELECT COUNT(*)')) {
        const tableMatch = sql.match(/FROM\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          let tableData = dbData[tableName] || [];
          
          // Check for filter (e.g., WHERE role = 'dietitian' or status = 'Active')
          if (normalizedSql.includes('WHERE ROLE =')) {
            const role = params[0] || 'dietitian';
            tableData = tableData.filter(u => u.role === role);
          } else if (normalizedSql.includes('WHERE STATUS =')) {
            const status = params[0] || 'Active';
            tableData = tableData.filter(dp => dp.status === status);
          }
          
          return resolve({ rows: [{ count: tableData.length }] });
        }
      }

      // 3. SELECT id/ * FROM users WHERE email = $1
      if (normalizedSql.startsWith('SELECT ID FROM USERS WHERE EMAIL =') || normalizedSql.startsWith('SELECT * FROM USERS WHERE EMAIL =')) {
        const email = params[0] ? params[0].toLowerCase().trim() : '';
        const user = dbData.users.find(u => u.email.toLowerCase() === email);
        return resolve({ rows: user ? [user] : [] });
      }

      // 4. SELECT id, name, email, phone, created_at FROM users WHERE role = 'dietitian'
      if (normalizedSql.startsWith('SELECT ID, NAME, EMAIL, PHONE, CREATED_AT FROM USERS WHERE ROLE =')) {
        const role = params[0] || 'dietitian';
        const dietitians = dbData.users
          .filter(u => u.role === role)
          .map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at }));
        return resolve({ rows: dietitians });
      }

      // 5. SELECT id, name, email, role, phone, created_at FROM users
      if (normalizedSql.startsWith('SELECT ID, NAME, EMAIL, ROLE, PHONE, CREATED_AT FROM USERS')) {
        const list = dbData.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, created_at: u.created_at }));
        return resolve({ rows: list });
      }

      // 5.5 Height lookup query for BMI calculations
      if (normalizedSql.startsWith('SELECT HEIGHT FROM PATIENTS WHERE ID =')) {
        const patientId = parseInt(params[0]);
        const patient = dbData.patients.find(p => p.id === patientId);
        return resolve({ rows: patient ? [{ height: patient.height }] : [] });
      }

      // 5.55 Patient ID by User ID lookup query
      if (normalizedSql.startsWith('SELECT ID FROM PATIENTS WHERE USER_ID =')) {
        const userId = parseInt(params[0]);
        const patient = dbData.patients.find(p => p.user_id === userId);
        return resolve({ rows: patient ? [{ id: patient.id }] : [] });
      }

      // 5.57 SELECT user_id, dietitian_id FROM patients WHERE id = $1
      if (normalizedSql.startsWith('SELECT USER_ID, DIETITIAN_ID FROM PATIENTS WHERE ID =')) {
        const id = parseInt(params[0]);
        const patient = dbData.patients.find(p => p.id === id);
        return resolve({ rows: patient ? [{ user_id: patient.user_id, dietitian_id: patient.dietitian_id }] : [] });
      }

      // 5.58 SELECT id FROM ayurvedic_profiles WHERE patient_id = $1
      if (normalizedSql.startsWith('SELECT ID FROM AYURVEDIC_PROFILES WHERE PATIENT_ID =')) {
        const patientId = parseInt(params[0]);
        const profile = dbData.ayurvedic_profiles.find(ap => ap.patient_id === patientId);
        return resolve({ rows: profile ? [{ id: profile.id }] : [] });
      }

      // 5.6 Admin stats queries fallback
      if (normalizedSql === 'SELECT CREATED_AT FROM PATIENTS') {
        const list = dbData.patients.map(p => ({ created_at: p.created_at }));
        return resolve({ rows: list });
      }
      if (normalizedSql === 'SELECT STATUS, APPOINTMENT_DATE FROM APPOINTMENTS') {
        const list = dbData.appointments.map(a => ({ status: a.status, appointment_date: a.appointment_date }));
        return resolve({ rows: list });
      }
      if (normalizedSql === 'SELECT STATUS FROM DIET_PLANS') {
        const list = dbData.diet_plans.map(dp => ({ status: dp.status }));
        return resolve({ rows: list });
      }
      if (normalizedSql === 'SELECT PRAKRITI FROM AYURVEDIC_PROFILES') {
        const list = dbData.ayurvedic_profiles.map(ap => ({ prakriti: ap.prakriti }));
        return resolve({ rows: list });
      }

      // 6. Join query for patients list
      if (normalizedSql.startsWith('SELECT P.*, U.NAME, U.EMAIL, U.PHONE, AP.PRAKRITI FROM PATIENTS')) {
        let list = dbData.patients.map(p => {
          const u = dbData.users.find(user => user.id === p.user_id) || {};
          const ap = dbData.ayurvedic_profiles.find(prof => prof.patient_id === p.id) || {};
          return {
            ...p,
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            prakriti: ap.prakriti || 'Vata'
          };
        });

        // Check filters
        if (normalizedSql.includes('WHERE P.DIETITIAN_ID =')) {
          const dietitianId = parseInt(params[0]);
          list = list.filter(p => p.dietitian_id === dietitianId);
        } else if (normalizedSql.includes('WHERE P.USER_ID =')) {
          const userId = parseInt(params[0]);
          list = list.filter(p => p.user_id === userId);
        }

        return resolve({ rows: list });
      }

      // 7. Join query for patient detail by id
      if (normalizedSql.includes('FROM PATIENTS') && normalizedSql.includes('WHERE P.ID =')) {
        const id = parseInt(params[0]);
        const p = dbData.patients.find(pat => pat.id === id);
        if (!p) return resolve({ rows: [] });

        const u = dbData.users.find(user => user.id === p.user_id) || {};
        const ap = dbData.ayurvedic_profiles.find(prof => prof.patient_id === p.id) || {};
        
        const detail = {
          ...p,
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          prakriti: ap.prakriti || 'Vata',
          rasa_preference: ap.rasa_preference || null,
          lifestyle_notes: ap.lifestyle_notes || null,
          sleep_duration: ap.sleep_duration || 7.0,
          exercise_level: ap.exercise_level || null,
          stress_level: ap.stress_level || null,
          water_intake: ap.water_intake || 2.0
        };

        return resolve({ rows: [detail] });
      }

      // 8. Foods lookup
      if (normalizedSql.startsWith('SELECT * FROM FOODS WHERE 1=1')) {
        let list = [...dbData.foods];
        let pIdx = 0;

        // Apply filters in order
        if (sql.includes('LOWER(name) LIKE')) {
          const search = params[pIdx].replace(/%/g, '').toLowerCase().trim();
          list = list.filter(f => f.name.toLowerCase().includes(search));
          pIdx++;
        }
        if (sql.includes('category =')) {
          const cat = params[pIdx];
          list = list.filter(f => f.category === cat);
          pIdx++;
        }
        if (sql.includes('LOWER(dosha_effect) LIKE')) {
          const dosha = params[pIdx].replace(/%/g, '').toLowerCase().trim();
          list = list.filter(f => 
            (f.dosha_effect && f.dosha_effect.toLowerCase().includes(dosha)) ||
            (f.benefits && f.benefits.toLowerCase().includes(dosha))
          );
          pIdx++;
        }

        return resolve({ rows: list });
      }

      // 9. Food by ID
      if (normalizedSql.startsWith('SELECT * FROM FOODS WHERE ID =')) {
        const id = parseInt(params[0]);
        const f = dbData.foods.find(food => food.id === id);
        return resolve({ rows: f ? [f] : [] });
      }

      // 10. Diet Plans list
      if (normalizedSql.startsWith('SELECT DP.*, P_U.NAME AS PATIENT_NAME') && normalizedSql.includes('FROM DIET_PLANS')) {
        let list = dbData.diet_plans.map(dp => {
          const p = dbData.patients.find(pat => pat.id === dp.patient_id) || {};
          const p_u = dbData.users.find(u => u.id === p.user_id) || {};
          const d_u = dbData.users.find(u => u.id === dp.dietitian_id) || {};
          return {
            ...dp,
            patient_name: p_u.name || 'Unknown Patient',
            dietitian_name: d_u.name || 'Unknown Dietitian'
          };
        });

        if (normalizedSql.includes('WHERE DP.DIETITIAN_ID =')) {
          const dId = parseInt(params[0]);
          list = list.filter(dp => dp.dietitian_id === dId);
        } else if (normalizedSql.includes('WHERE P.USER_ID =')) {
          const uId = parseInt(params[0]);
          list = list.filter(dp => {
            const p = dbData.patients.find(pat => pat.id === dp.patient_id) || {};
            return p.user_id === uId;
          });
        }

        return resolve({ rows: list });
      }

      // 11. Diet Plan details by id
      if (normalizedSql.includes('FROM DIET_PLANS') && normalizedSql.includes('WHERE DP.ID =')) {
        const id = parseInt(params[0]);
        const dp = dbData.diet_plans.find(plan => plan.id === id);
        if (!dp) return resolve({ rows: [] });

        const p = dbData.patients.find(pat => pat.id === dp.patient_id) || {};
        const p_u = dbData.users.find(u => u.id === p.user_id) || {};
        const ap = dbData.ayurvedic_profiles.find(prof => prof.patient_id === dp.patient_id) || {};
        const d_u = dbData.users.find(u => u.id === dp.dietitian_id) || {};

        const detail = {
          ...dp,
          patient_name: p_u.name || '',
          patient_phone: p_u.phone || '',
          patient_email: p_u.email || '',
          date_of_birth: p.date_of_birth || null,
          gender: p.gender || null,
          height: p.height || 0,
          weight: p.weight || 0,
          bmi: p.bmi || 0,
          prakriti: ap.prakriti || 'Vata',
          rasa_preference: ap.rasa_preference || null,
          lifestyle_notes: ap.lifestyle_notes || null,
          dietitian_name: d_u.name || ''
        };

        return resolve({ rows: [detail] });
      }

      // 12. Meals and meal items query
      if (normalizedSql.includes('FROM MEALS M LEFT JOIN MEAL_ITEMS MI') && normalizedSql.includes('WHERE M.DIET_PLAN_ID =')) {
        const planId = parseInt(params[0]);
        const meals = dbData.meals.filter(m => m.diet_plan_id === planId);
        
        const joined = [];
        meals.forEach(m => {
          const items = dbData.meal_items.filter(mi => mi.meal_id === m.id);
          
          if (items.length === 0) {
            joined.push({
              meal_id: m.id,
              meal_date: m.meal_date,
              meal_type: m.meal_type,
              meal_notes: m.notes,
              item_id: null
            });
          } else {
            items.forEach(mi => {
              const f = dbData.foods.find(food => food.id === mi.food_id) || {};
              joined.push({
                meal_id: m.id,
                meal_date: m.meal_date,
                meal_type: m.meal_type,
                meal_notes: m.notes,
                item_id: mi.id,
                food_id: mi.food_id,
                quantity: mi.quantity,
                calories: mi.calories,
                protein: mi.protein,
                carbohydrates: mi.carbohydrates,
                fat: mi.fat,
                fiber: mi.fiber,
                food_name: f.name || '',
                food_category: f.category || '',
                serving_size: f.serving_size || '',
                rasa: f.rasa,
                guna: f.guna,
                virya: f.virya,
                vipaka: f.vipaka,
                dosha_effect: f.dosha_effect,
                benefits: f.benefits,
                cautions: f.cautions
              });
            });
          }
        });

        return resolve({ rows: joined });
      }

      // 13. Appointments list
      if (normalizedSql.startsWith('SELECT A.*, P_U.NAME AS PATIENT_NAME') && normalizedSql.includes('FROM APPOINTMENTS')) {
        let list = dbData.appointments.map(a => {
          const p = dbData.patients.find(pat => pat.id === a.patient_id) || {};
          const p_u = dbData.users.find(u => u.id === p.user_id) || {};
          const d_u = dbData.users.find(u => u.id === a.dietitian_id) || {};
          return {
            ...a,
            patient_name: p_u.name || 'Unknown Patient',
            patient_email: p_u.email || '',
            patient_phone: p_u.phone || '',
            dietitian_name: d_u.name || 'Unknown Dietitian'
          };
        });

        if (normalizedSql.includes('WHERE A.DIETITIAN_ID =')) {
          const dId = parseInt(params[0]);
          list = list.filter(a => a.dietitian_id === dId);
        } else if (normalizedSql.includes('WHERE P.USER_ID =')) {
          const uId = parseInt(params[0]);
          list = list.filter(a => {
            const p = dbData.patients.find(pat => pat.id === a.patient_id) || {};
            return p.user_id === uId;
          });
        }

        return resolve({ rows: list });
      }

      // 14. Consultations list
      if (normalizedSql.startsWith('SELECT C.*, P_U.NAME AS PATIENT_NAME') && normalizedSql.includes('FROM CONSULTATIONS')) {
        let list = dbData.consultations.map(c => {
          const p = dbData.patients.find(pat => pat.id === c.patient_id) || {};
          const p_u = dbData.users.find(u => u.id === p.user_id) || {};
          const d_u = dbData.users.find(u => u.id === c.dietitian_id) || {};
          return {
            ...c,
            patient_name: p_u.name || '',
            dietitian_name: d_u.name || ''
          };
        });

        let pIdx = 0;
        if (sql.includes('c.patient_id =')) {
          const pId = parseInt(params[pIdx]);
          list = list.filter(c => c.patient_id === pId);
          pIdx++;
        } else if (sql.includes('p.user_id =')) {
          const uId = parseInt(params[pIdx]);
          list = list.filter(c => {
            const p = dbData.patients.find(pat => pat.id === c.patient_id) || {};
            return p.user_id === uId;
          });
          pIdx++;
        }

        if (sql.includes('c.dietitian_id =')) {
          const dId = parseInt(params[pIdx]);
          list = list.filter(c => c.dietitian_id === dId);
          pIdx++;
        }

        return resolve({ rows: list });
      }

      // 15. Progress records
      if (normalizedSql.startsWith('SELECT * FROM PROGRESS_RECORDS WHERE PATIENT_ID =')) {
        const pId = parseInt(params[0]);
        const list = dbData.progress_records.filter(pr => pr.patient_id === pId);
        return resolve({ rows: list });
      }

      // 16. INSERT DML Emulator
      if (normalizedSql.startsWith('INSERT INTO')) {
        const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          
          // Parse columns
          const colPart = sql.slice(sql.indexOf('(') + 1, sql.indexOf(')'));
          const cols = colPart.split(',').map(c => c.trim().toLowerCase());
          
          const newRow = { id: dbData[tableName].length + 1 };
          
          cols.forEach((col, index) => {
            newRow[col] = params[index] !== undefined ? params[index] : null;
          });

          newRow.created_at = new Date().toISOString();
          newRow.updated_at = new Date().toISOString();

          dbData[tableName].push(newRow);
          saveJsonDb();

          return resolve({ rows: [newRow], rowCount: 1, lastID: newRow.id });
        }
      }

      // 17. UPDATE DML Emulator
      if (normalizedSql.startsWith('UPDATE')) {
        const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          
          // Parse SET assignments
          // Find where id is specified.
          const idVal = parseInt(params[params.length - 1]);
          const keyField = sql.includes('patient_id =') && tableName === 'ayurvedic_profiles' ? 'patient_id' : 'id';
          
          const rowIndex = dbData[tableName].findIndex(row => row[keyField] === idVal);
          
          if (rowIndex !== -1) {
            // Find assignments e.g., name = COALESCE($1, name)
            // Or simple SET name = $1
            const setPart = sql.slice(sql.indexOf('SET') + 3, sql.indexOf('WHERE'));
            const assignments = setPart.split(',').map(a => a.trim());
            
            assignments.forEach((assignment) => {
              const parts = assignment.split('=');
              if (parts.length < 2) return;
              const col = parts[0].trim().toLowerCase();
              const rightHandSide = parts.slice(1).join('=').trim();
              
              // Extract the parameter placeholder, e.g. $1, $12, etc.
              const paramMatch = rightHandSide.match(/\$(\d+)/);
              if (paramMatch) {
                const paramIdx = parseInt(paramMatch[1]) - 1;
                const paramValue = params[paramIdx];
                
                if (paramValue !== undefined) {
                  // Handle COALESCE logic
                  if (rightHandSide.toUpperCase().includes('COALESCE')) {
                    if (paramValue !== null) {
                      dbData[tableName][rowIndex][col] = paramValue;
                    }
                  } else {
                    dbData[tableName][rowIndex][col] = paramValue;
                  }
                }
              } else {
                // If it is CURRENT_TIMESTAMP or similar, assign the current time
                if (rightHandSide.toUpperCase().includes('CURRENT_TIMESTAMP') || rightHandSide.toUpperCase().includes('NOW()')) {
                  dbData[tableName][rowIndex][col] = new Date().toISOString();
                }
              }
            });
            
            dbData[tableName][rowIndex].updated_at = new Date().toISOString();
            saveJsonDb();
            
            return resolve({ rows: [dbData[tableName][rowIndex]], rowCount: 1 });
          } else {
            return resolve({ rows: [], rowCount: 0 });
          }
        }
      }

      // 18. DELETE DML Emulator
      if (normalizedSql.startsWith('DELETE FROM')) {
        const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const idVal = parseInt(params[0]);
          
          const initLen = dbData[tableName].length;
          dbData[tableName] = dbData[tableName].filter(row => row.id !== idVal);
          
          // If we delete from users, cascade delete patients, and delete diet_plans etc.
          if (tableName === 'users') {
            const pRows = dbData.patients.filter(p => p.user_id === idVal);
            pRows.forEach(pr => {
              dbData.patients = dbData.patients.filter(p => p.id !== pr.id);
              dbData.ayurvedic_profiles = dbData.ayurvedic_profiles.filter(ap => ap.patient_id !== pr.id);
              dbData.diet_plans = dbData.diet_plans.filter(dp => dp.patient_id !== pr.id);
              dbData.appointments = dbData.appointments.filter(a => a.patient_id !== pr.id);
              dbData.consultations = dbData.consultations.filter(c => c.patient_id !== pr.id);
              dbData.progress_records = dbData.progress_records.filter(prr => prr.patient_id !== pr.id);
            });
          } else if (tableName === 'patients') {
            dbData.ayurvedic_profiles = dbData.ayurvedic_profiles.filter(ap => ap.patient_id !== idVal);
            dbData.diet_plans = dbData.diet_plans.filter(dp => dp.patient_id !== idVal);
            dbData.appointments = dbData.appointments.filter(a => a.patient_id !== idVal);
            dbData.consultations = dbData.consultations.filter(c => c.patient_id !== idVal);
            dbData.progress_records = dbData.progress_records.filter(prr => prr.patient_id !== idVal);
          } else if (tableName === 'diet_plans') {
            const meals = dbData.meals.filter(m => m.diet_plan_id === idVal);
            meals.forEach(m => {
              dbData.meal_items = dbData.meal_items.filter(mi => mi.meal_id !== m.id);
            });
            dbData.meals = dbData.meals.filter(m => m.diet_plan_id !== idVal);
          } else if (tableName === 'meals') {
            // Delete meal cascades to meal_items if deleting specific meal
            // (e.g. during updates when we clear existing meals of a plan)
            // Wait, we query DELETE FROM meals WHERE diet_plan_id = $1
            if (sql.includes('diet_plan_id =')) {
              const planIdVal = parseInt(params[0]);
              const planMeals = dbData.meals.filter(m => m.diet_plan_id === planIdVal);
              planMeals.forEach(pm => {
                dbData.meal_items = dbData.meal_items.filter(mi => mi.meal_id !== pm.id);
              });
              dbData.meals = dbData.meals.filter(m => m.diet_plan_id !== planIdVal);
            } else {
              dbData.meal_items = dbData.meal_items.filter(mi => mi.meal_id !== idVal);
            }
          }
          
          saveJsonDb();
          return resolve({ rowCount: initLen - dbData[tableName].length });
        }
      }

      console.warn('⚠️ SQL Query not matched in JSON emulator:', sql);
      return resolve({ rows: [], rowCount: 0 });
    } catch (e) {
      console.error('❌ JSON Emulator Query Error:', e);
      return reject(e);
    }
  });
}

async function initDb() {
  if (!isJSONdb) return; // PostgreSQL runs SQL scripts directly on startup
  
  if (dbData.users.length === 0) {
    console.log('🌱 Seeding local JSON database...');
    
    // Hash default user passwords
    const adminHash = bcrypt.hashSync('admin123', 10);
    const dietitian1Hash = bcrypt.hashSync('dietitian123', 10);
    const dietitian2Hash = bcrypt.hashSync('dietitian123', 10);
    const patient1Hash = bcrypt.hashSync('patient123', 10);
    const patient2Hash = bcrypt.hashSync('patient123', 10);

    // 1. Create Users
    dbData.users = [
      { id: 1, name: 'Ayurveda Admin', email: 'admin@ayurdiet.com', password_hash: adminHash, role: 'admin', phone: '+15550100', created_at: new Date().toISOString() },
      { id: 2, name: 'Dr. Aarav Sharma (Vata/Pitta Specialist)', email: 'dietitian1@ayurdiet.com', password_hash: dietitian1Hash, role: 'dietitian', phone: '+15550101', created_at: new Date().toISOString() },
      { id: 3, name: 'Dr. Ananya Iyer (Kapha Specialist)', email: 'dietitian2@ayurdiet.com', password_hash: dietitian2Hash, role: 'dietitian', phone: '+15550102', created_at: new Date().toISOString() },
      { id: 4, name: 'John Doe', email: 'john@gmail.com', password_hash: patient1Hash, role: 'patient', phone: '+15550201', created_at: new Date().toISOString() },
      { id: 5, name: 'Jane Smith', email: 'jane@gmail.com', password_hash: patient2Hash, role: 'patient', phone: '+15550202', created_at: new Date().toISOString() },
      { id: 6, name: 'Robert Johnson', email: 'robert@gmail.com', password_hash: patient2Hash, role: 'patient', phone: '+15550203', created_at: new Date().toISOString() },
      { id: 7, name: 'Emily Davis', email: 'emily@gmail.com', password_hash: patient2Hash, role: 'patient', phone: '+15550204', created_at: new Date().toISOString() },
      { id: 8, name: 'Michael Brown', email: 'michael@gmail.com', password_hash: patient2Hash, role: 'patient', phone: '+15550205', created_at: new Date().toISOString() }
    ];

    // 2. Parse and seed foods from foods definition
    // We will hardcode the 30 foods list in pure JS to make seeding instant and bulletproof
    dbData.foods = getSeededFoodsList();

    // 3. Create Patients
    dbData.patients = [
      { id: 1, user_id: 4, dietitian_id: 2, date_of_birth: '1985-05-15', gender: 'Male', height: 178, weight: 85.5, bmi: 27.0, activity_level: 'Moderate', allergies: 'None', dietary_restrictions: 'Gluten-Free', health_goal: 'Weight loss and energy improvement', current_diet: 'Typical Western Diet', lifestyle_info: 'Stressful work environment, irregular sleep', created_at: new Date().toISOString() },
      { id: 2, user_id: 5, dietitian_id: 2, date_of_birth: '1992-09-20', gender: 'Female', height: 165, weight: 54.0, bmi: 19.8, activity_level: 'Sedentary', allergies: 'Peanuts', dietary_restrictions: 'None', health_goal: 'Relieve bloating and joint pain', current_diet: 'High raw salad diet', lifestyle_info: 'Practices yoga 2x a week, sleep 6 hours', created_at: new Date().toISOString() },
      { id: 3, user_id: 6, dietitian_id: 3, date_of_birth: '1978-01-10', gender: 'Male', height: 182, weight: 95.0, bmi: 28.7, activity_level: 'Light', allergies: 'Dairy', dietary_restrictions: 'Vegetarian', health_goal: 'Manage chronic lethargy and weight', current_diet: 'Heavy fried foods and sweets', lifestyle_info: 'Sedentary office job, late night sleeper', created_at: new Date().toISOString() },
      { id: 4, user_id: 7, dietitian_id: 2, date_of_birth: '1995-11-30', gender: 'Female', height: 160, weight: 68.0, bmi: 26.6, activity_level: 'Active', allergies: 'None', dietary_restrictions: 'None', health_goal: 'Address hyperacidity and skin rashes', current_diet: 'Spicy and caffeinated food', lifestyle_info: 'Highly active runner, high-stress manager', created_at: new Date().toISOString() },
      { id: 5, user_id: 8, dietitian_id: 3, date_of_birth: '1989-07-04', gender: 'Male', height: 170, weight: 72.0, bmi: 24.9, activity_level: 'Moderate', allergies: 'Shellfish', dietary_restrictions: 'Vegan', health_goal: 'Optimize recovery and immune health', current_diet: 'Standard Vegan diet', lifestyle_info: 'Consistent workout routine, sleeps 8 hours', created_at: new Date().toISOString() }
    ];

    // 4. Create Ayurvedic Profiles
    dbData.ayurvedic_profiles = [
      { id: 1, patient_id: 1, prakriti: 'Kapha-Pitta', rasa_preference: 'Pungent, Bitter', lifestyle_notes: 'Sleeps late, feels heavy in the morning', sleep_duration: 7.5, exercise_level: 'Moderate', stress_level: 'Medium', water_intake: 2.0, created_at: new Date().toISOString() },
      { id: 2, patient_id: 2, prakriti: 'Vata', rasa_preference: 'Sweet, Sour, Salty', lifestyle_notes: 'Suffers from dry skin and cold extremities', sleep_duration: 6.0, exercise_level: 'Light', stress_level: 'High', water_intake: 1.5, created_at: new Date().toISOString() },
      { id: 3, patient_id: 3, prakriti: 'Kapha', rasa_preference: 'Pungent, Bitter, Astringent', lifestyle_notes: 'Prone to sleeping 9+ hours and daytime sleepiness', sleep_duration: 9.0, exercise_level: 'Sedentary', stress_level: 'Low', water_intake: 1.8, created_at: new Date().toISOString() },
      { id: 4, patient_id: 4, prakriti: 'Pitta', rasa_preference: 'Sweet, Bitter, Astringent', lifestyle_notes: 'Experiences hot flashes, quick irritability', sleep_duration: 7.0, exercise_level: 'High', stress_level: 'High', water_intake: 3.0, created_at: new Date().toISOString() },
      { id: 5, patient_id: 5, prakriti: 'Vata-Pitta', rasa_preference: 'Sweet, Bitter, Salty', lifestyle_notes: 'Has sensitive digestion, responds well to warm foods', sleep_duration: 8.0, exercise_level: 'Moderate', stress_level: 'Medium', water_intake: 2.5, created_at: new Date().toISOString() }
    ];

    // 5. Create Consultations
    dbData.consultations = [
      { id: 1, patient_id: 1, dietitian_id: 2, consultation_date: '2026-08-01', concerns: 'Lethargy, weight gain of 5kg, morning stiffness.', assessment: 'Kapha aggravation blocking Agni. Cold/wet qualities are high.', recommendations: 'Warm water with ginger in morning, light warm meals. Avoid cold milk and yogurt.', follow_up_date: '2026-08-15', notes: 'Client was motivated to follow the guidelines.', created_at: new Date().toISOString() },
      { id: 2, patient_id: 2, dietitian_id: 2, consultation_date: '2026-08-03', concerns: 'Severe bloating, gas, dry skin, anxiety.', assessment: 'Vata imbalance in colon, weak digestion (Manda Agni).', recommendations: 'Drink warm sesame oil in cooking. Take ginger-cumin-fennel tea. Avoid raw salads; eat warm cooked vegetables instead.', follow_up_date: '2026-08-17', notes: 'Vata pacifying lifestyle instructions given (regular sleeping hours).', created_at: new Date().toISOString() }
    ];

    // 6. Create Appointments
    dbData.appointments = [
      { id: 1, patient_id: 1, dietitian_id: 2, appointment_date: '2026-08-01', appointment_time: '10:00 AM', appointment_type: 'Initial Consultation', status: 'Completed', reason: 'First checkup', notes: 'Done. Found Kapha-Pitta type.', created_at: new Date().toISOString() },
      { id: 2, patient_id: 2, dietitian_id: 2, appointment_date: '2026-08-03', appointment_time: '11:30 AM', appointment_type: 'Initial Consultation', status: 'Completed', reason: 'Bloating and gas', notes: 'Done. Prescribed Vata pacifying foods.', created_at: new Date().toISOString() },
      { id: 3, patient_id: 1, dietitian_id: 2, appointment_date: '2026-08-15', appointment_time: '10:00 AM', appointment_type: 'Follow-up Consultation', status: 'Scheduled', reason: 'Review progress of weight and stiffness', notes: 'Check weight reduction', created_at: new Date().toISOString() },
      { id: 4, patient_id: 2, dietitian_id: 2, appointment_date: '2026-08-17', appointment_time: '11:30 AM', appointment_type: 'Follow-up Consultation', status: 'Scheduled', reason: 'Assess bloating progress', notes: 'Assess bowel movements', created_at: new Date().toISOString() }
    ];

    // 7. Create Progress Records
    dbData.progress_records = [
      { id: 1, patient_id: 1, record_date: '2026-08-01', weight: 85.5, bmi: 27.0, water_intake: 1.8, exercise: 'None', adherence: 'High', notes: 'Initial record.', created_at: new Date().toISOString() },
      { id: 2, patient_id: 1, record_date: '2026-08-07', weight: 84.2, bmi: 26.6, water_intake: 2.2, exercise: '15 min walk', adherence: 'High', notes: 'Lost 1.3kg.', created_at: new Date().toISOString() },
      { id: 3, patient_id: 2, record_date: '2026-08-03', weight: 54.0, bmi: 19.8, water_intake: 1.2, exercise: 'Yoga 1x', adherence: 'Medium', notes: 'Initial record.', created_at: new Date().toISOString() },
      { id: 4, patient_id: 2, record_date: '2026-08-07', weight: 53.8, bmi: 19.7, water_intake: 1.8, exercise: 'Yoga 2x', adherence: 'High', notes: 'Bloating has reduced.', created_at: new Date().toISOString() }
    ];

    // 8. Create Diet Plans
    dbData.diet_plans = [
      { id: 1, patient_id: 1, dietitian_id: 2, start_date: '2026-08-01', end_date: '2026-08-15', health_goal: 'Reduce Kapha congestion & support weight loss', notes: 'Eat warm cooked meals.', status: 'Active', created_at: new Date().toISOString() }
    ];

    // 9. Create Meals and items for Diet Plan 1
    dbData.meals = [
      { id: 1, diet_plan_id: 1, meal_date: '2026-08-08', meal_type: 'Early Morning', notes: 'Warm ginger water' },
      { id: 2, diet_plan_id: 1, meal_date: '2026-08-08', meal_type: 'Breakfast', notes: 'Spiced oatmeal' },
      { id: 3, diet_plan_id: 1, meal_date: '2026-08-08', meal_type: 'Lunch', notes: 'Kitchari and Asparagus' }
    ];

    dbData.meal_items = [
      // Early morning
      { id: 1, meal_id: 1, food_id: 27, quantity: 250, calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 },
      { id: 2, meal_id: 1, food_id: 4, quantity: 5, calories: 4, protein: 0.1, carbohydrates: 0.9, fat: 0.05, fiber: 0.1 },
      // Breakfast
      { id: 3, meal_id: 2, food_id: 20, quantity: 150, calories: 110, protein: 4, carbohydrates: 19, fat: 2, fiber: 3 },
      { id: 4, meal_id: 2, food_id: 8, quantity: 10, calories: 30.6, protein: 0.03, carbohydrates: 8.0, fat: 0, fiber: 0 },
      // Lunch
      { id: 5, meal_id: 3, food_id: 28, quantity: 200, calories: 240, protein: 9, carbohydrates: 42, fat: 5, fiber: 6 },
      { id: 6, meal_id: 3, food_id: 30, quantity: 100, calories: 20, protein: 2.2, carbohydrates: 3.9, fat: 0.1, fiber: 2.1 }
    ];

    saveJsonDb();
    console.log('🌱 Seeded local JSON database complete.');
  } else {
    console.log('📋 JSON database already seeded.');
  }
}

// Return static list of foods matching seed.sql
function getSeededFoodsList() {
  return [
    { id: 1, name: 'Basmati Rice', category: 'Grains', serving_size: '100g', calories: 130, protein: 2.7, carbohydrates: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1, calcium: 10, iron: 1.2, potassium: 35, vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet', guna: 'Light, Soft', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K+ (in excess)', benefits: 'Easy to digest, builds tissue, calming for the mind', cautions: 'Refined rice is low in fiber; eat in moderation for Kapha' },
    { id: 2, name: 'Mung Dal (Split)', category: 'Pulses', serving_size: '100g', calories: 105, protein: 7, carbohydrates: 19, fat: 0.4, fiber: 7.6, sugar: 1.5, sodium: 2, calcium: 27, iron: 1.4, potassium: 260, vitamin_a: 4, vitamin_c: 1, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Astringent', guna: 'Light, Dry', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'Tridoshic (V= P= K=)', benefits: 'Very easy to digest, detoxifying, rich in vegetable protein', cautions: 'None for general use; cook with cumin/ginger to prevent gas' },
    { id: 3, name: 'A2 Cow Ghee', category: 'Oils', serving_size: '10g', calories: 90, protein: 0, carbohydrates: 0, fat: 10, fiber: 0, sugar: 0, sodium: 0, calcium: 0, iron: 0, potassium: 0, vitamin_a: 80, vitamin_c: 0, vitamin_d: 0.2, vitamin_b12: 0, rasa: 'Sweet', guna: 'Oily, Soft, Heavy', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K+ (in excess)', benefits: 'Improves digestion (Agni), enhances memory and brain health, lubricates joints', cautions: 'Avoid in cases of high cholesterol or extreme Kapha congestion' },
    { id: 4, name: 'Fresh Ginger', category: 'Spices', serving_size: '10g', calories: 8, protein: 0.2, carbohydrates: 1.8, fat: 0.1, fiber: 0.2, sugar: 0.2, sodium: 1, calcium: 1.6, iron: 0.06, potassium: 41.5, vitamin_a: 0, vitamin_c: 0.5, vitamin_d: 0, vitamin_b12: 0, rasa: 'Pungent', guna: 'Sharp, Dry, Light', virya: 'Heating', vipaka: 'Sweet', dosha_effect: 'V- K- P+ (in excess)', benefits: 'Kindles digestive fire, relieves bloating, digests toxins (Ama)', cautions: 'Avoid in hyperacidity, active bleeding, or high Pitta conditions' },
    { id: 5, name: 'Turmeric Powder', category: 'Spices', serving_size: '5g', calories: 16, protein: 0.4, carbohydrates: 3.2, fat: 0.5, fiber: 1.1, sugar: 0.1, sodium: 2, calcium: 9, iron: 2.7, potassium: 125, vitamin_a: 0, vitamin_c: 1.3, vitamin_d: 0, vitamin_b12: 0, rasa: 'Bitter, Pungent, Astringent', guna: 'Dry, Light', virya: 'Heating', vipaka: 'Pungent', dosha_effect: 'K- P- (in moderation) V+', benefits: 'Natural anti-inflammatory, purifies blood, heals skin', cautions: 'Can be drying; Vata types should take it with Ghee/Milk' },
    { id: 6, name: 'Cumin Seeds', category: 'Spices', serving_size: '5g', calories: 18, protein: 0.9, carbohydrates: 2.2, fat: 1.1, fiber: 0.5, sugar: 0.1, sodium: 8, calcium: 46, iron: 3.3, potassium: 89, vitamin_a: 6, vitamin_c: 0.4, vitamin_d: 0, vitamin_b12: 0, rasa: 'Pungent, Bitter', guna: 'Light, Dry', virya: 'Heating', vipaka: 'Pungent', dosha_effect: 'Tridoshic (V= P= K=)', benefits: 'Enhances absorption, relieves flatulence, supports liver function', cautions: 'None in dietary amounts' },
    { id: 7, name: 'Whole Almonds (Soaked)', category: 'Nuts', serving_size: '28g', calories: 160, protein: 6, carbohydrates: 6, fat: 14, fiber: 3.5, sugar: 1.2, sodium: 1, calcium: 75, iron: 1, potassium: 200, vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet', guna: 'Heavy, Oily, Soft', virya: 'Heating', vipaka: 'Sweet', dosha_effect: 'V- P= K+ (in excess)', benefits: 'Nourishes the nervous system, promotes vitality (Ojas)', cautions: 'Unpeeled almonds are hard to digest; soak and peel before eating' },
    { id: 8, name: 'Raw Honey', category: 'Prepared Foods', serving_size: '15g', calories: 46, protein: 0.05, carbohydrates: 12, fat: 0, fiber: 0, sugar: 12, sodium: 1, calcium: 1, iron: 0.05, potassium: 8, vitamin_a: 0, vitamin_c: 0.1, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Astringent', guna: 'Light, Dry, Mobile', virya: 'Heating', vipaka: 'Sweet', dosha_effect: 'K- V= P+ (in excess)', benefits: 'Scrapes fat, clears Kapha congestion, carries herbs deep (Anupana)', cautions: 'NEVER heat honey or cook with it; becomes toxic (Ama)' },
    { id: 9, name: 'Whole Milk (Warm)', category: 'Dairy', serving_size: '200ml', calories: 120, protein: 6.4, carbohydrates: 9.6, fat: 6.5, fiber: 0, sugar: 9.6, sodium: 90, calcium: 240, iron: 0.1, potassium: 320, vitamin_a: 90, vitamin_c: 1, vitamin_d: 2, vitamin_b12: 0.9, rasa: 'Sweet', guna: 'Heavy, Oily, Cool', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K+ (in excess)', benefits: 'Deeply nourishing, builds tissues, calming before sleep', cautions: 'Drink warm with spices (cardamom, ginger) to prevent congestion' },
    { id: 10, name: 'Spinach (Cooked)', category: 'Vegetables', serving_size: '100g', calories: 23, protein: 2.9, carbohydrates: 3.6, fat: 0.4, fiber: 2.4, sugar: 0.4, sodium: 79, calcium: 99, iron: 2.7, potassium: 558, vitamin_a: 469, vitamin_c: 9.8, vitamin_d: 0, vitamin_b12: 0, rasa: 'Bitter, Astringent', guna: 'Light, Dry', virya: 'Cooling', vipaka: 'Pungent', dosha_effect: 'P- K- V+ (in excess)', benefits: 'Rich in iron, cleanses blood, cooling for body', cautions: 'Can create gas for Vata; cook with ghee, cumin, and garlic' },
    { id: 11, name: 'Red Apple', category: 'Fruits', serving_size: '150g', calories: 78, protein: 0.4, carbohydrates: 21, fat: 0.2, fiber: 3.6, sugar: 16, sodium: 1, calcium: 9, iron: 0.2, potassium: 160, vitamin_a: 5, vitamin_c: 7, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Astringent', guna: 'Light, Dry', virya: 'Cooling', vipaka: 'Pungent', dosha_effect: 'P- K- V+ (raw)', benefits: 'Astringent properties clean teeth, digests easily when cooked', cautions: 'Raw apples can aggravate Vata; cook with cinnamon for Vata' },
    { id: 12, name: 'Ripe Banana', category: 'Fruits', serving_size: '120g', calories: 105, protein: 1.3, carbohydrates: 27, fat: 0.3, fiber: 3, sugar: 14, sodium: 1, calcium: 6, iron: 0.3, potassium: 420, vitamin_a: 8, vitamin_c: 10, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet', guna: 'Heavy, Oily', virya: 'Heating', vipaka: 'Sweet', dosha_effect: 'V- P+ K+', benefits: 'Fast energy, acts as a mild laxative, highly grounding', cautions: 'Creates heavy congestion if eaten at night or with milk' },
    { id: 13, name: 'Steamed Broccoli', category: 'Vegetables', serving_size: '100g', calories: 35, protein: 2.8, carbohydrates: 7, fat: 0.4, fiber: 2.6, sugar: 1.5, sodium: 33, calcium: 47, iron: 0.7, potassium: 316, vitamin_a: 31, vitamin_c: 89.2, vitamin_d: 0, vitamin_b12: 0, rasa: 'Bitter, Astringent', guna: 'Dry, Light', virya: 'Cooling', vipaka: 'Pungent', dosha_effect: 'P- K- V+', benefits: 'Detoxifies liver, high in Vitamin C and fiber', cautions: 'Aggravates Vata (creates bloating); cook with oil/ghee and cumin' },
    { id: 14, name: 'Quinoa (Cooked)', category: 'Grains', serving_size: '100g', calories: 120, protein: 4.4, carbohydrates: 21.3, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 7, calcium: 17, iron: 1.5, potassium: 172, vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Astringent', guna: 'Light, Dry', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'Tridoshic (V= P= K=)', benefits: 'High protein, easy to digest, balances blood sugar', cautions: 'Slightly drying; add a dash of ghee for Vata types' },
    { id: 15, name: 'Buttermilk (Takra)', category: 'Dairy', serving_size: '200ml', calories: 80, protein: 6, carbohydrates: 9, fat: 2, fiber: 0, sugar: 9, sodium: 210, calcium: 220, iron: 0.1, potassium: 300, vitamin_a: 40, vitamin_c: 1, vitamin_d: 0, vitamin_b12: 0.8, rasa: 'Sour, Astringent, Sweet', guna: 'Light, Dry', virya: 'Heating', vipaka: 'Sweet', dosha_effect: 'V- K- P= (if sweet)', benefits: 'Excellent for digestion, cures IBS, helps absorb nutrients', cautions: 'Do not drink cold; prepare fresh with roasted cumin and salt' },
    { id: 16, name: 'Sweet Potato', category: 'Vegetables', serving_size: '100g', calories: 86, protein: 1.6, carbohydrates: 20, fat: 0.1, fiber: 3, sugar: 4.2, sodium: 55, calcium: 30, iron: 0.6, potassium: 337, vitamin_a: 700, vitamin_c: 2.4, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet', guna: 'Heavy, Soft, Oily', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K+ (in excess)', benefits: 'Highly grounding, builds body strength, very gentle on stomach', cautions: 'None for general use; limit portions for heavy Kapha' },
    { id: 17, name: 'Fennel Seeds', category: 'Spices', serving_size: '5g', calories: 17, protein: 0.8, carbohydrates: 2.6, fat: 0.7, fiber: 2, sugar: 0.1, sodium: 4, calcium: 60, iron: 0.9, potassium: 85, vitamin_a: 7, vitamin_c: 0.6, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Pungent, Bitter', guna: 'Light, Dry', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'Tridoshic (V= P= K=)', benefits: 'Best herb for digestive cramping, gas, and cooling the stomach', cautions: 'None' },
    { id: 18, name: 'Cardamom Pods', category: 'Spices', serving_size: '2g', calories: 6, protein: 0.2, carbohydrates: 1.3, fat: 0.1, fiber: 0.5, sugar: 0, sodium: 0.4, calcium: 7, iron: 0.3, potassium: 22, vitamin_a: 0, vitamin_c: 0.4, vitamin_d: 0, vitamin_b12: 0, rasa: 'Pungent, Sweet', guna: 'Light, Dry', virya: 'Heating', vipaka: 'Sweet', dosha_effect: 'V- K- P= (in moderation)', benefits: 'Reduces mucus from dairy, freshens breath, stimulates appetite', cautions: 'Use sparingly in high Pitta inflammation' },
    { id: 19, name: 'Black Pepper', category: 'Spices', serving_size: '2g', calories: 5, protein: 0.2, carbohydrates: 1.3, fat: 0.1, fiber: 0.5, sugar: 0, sodium: 0.4, calcium: 9, iron: 0.2, potassium: 26, vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'Pungent', guna: 'Light, Sharp, Dry', virya: 'Heating', vipaka: 'Pungent', dosha_effect: 'V- K- P+', benefits: 'Burns fat, clears sinus congestion, destroys Ama toxins', cautions: 'Avoid in hyperacidity, ulcers, or high inflammation' },
    { id: 20, name: 'Oatmeal (Cooked)', category: 'Grains', serving_size: '150g', calories: 110, protein: 4, carbohydrates: 19, fat: 2, fiber: 3, sugar: 0.5, sodium: 2, calcium: 40, iron: 1.5, potassium: 110, vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet', guna: 'Heavy, Oily, Sticky', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K+ (in excess)', benefits: 'Heart healthy, highly soothing, builds endurance', cautions: 'Too sticky/slimy for Kapha; cook with cardamom and dry ginger' },
    { id: 21, name: 'Dates (Medjool)', category: 'Fruits', serving_size: '24g', calories: 66, protein: 0.4, carbohydrates: 18, fat: 0.05, fiber: 1.6, sugar: 16, sodium: 0.5, calcium: 15, iron: 0.2, potassium: 167, vitamin_a: 3, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet', guna: 'Heavy, Oily', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K+ (in excess)', benefits: 'Highest source of Ojas (vitality), relieves constipation', cautions: 'Very high sugar, check in diabetes or high Kapha obesity' },
    { id: 22, name: 'Coriander Seeds', category: 'Spices', serving_size: '5g', calories: 15, protein: 0.6, carbohydrates: 2.7, fat: 0.9, fiber: 2.1, sugar: 0, sodium: 1.7, calcium: 35, iron: 0.8, potassium: 60, vitamin_a: 0, vitamin_c: 1, vitamin_d: 0, vitamin_b12: 0, rasa: 'Bitter, Pungent, Sweet', guna: 'Light, Dry', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'Tridoshic (V= P= K=)', benefits: 'Great cooling spice, supports kidney health, relieves thirst', cautions: 'None' },
    { id: 23, name: 'Fresh Coconut Water', category: 'Beverages', serving_size: '200ml', calories: 38, protein: 1.4, carbohydrates: 9, fat: 0.4, fiber: 2.2, sugar: 6, sodium: 50, calcium: 48, iron: 0.6, potassium: 500, vitamin_a: 0, vitamin_c: 4.8, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet', guna: 'Light, Oily, Soft', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V= P- K+ (in excess)', benefits: 'Deeply hydrating, cools urinary tract, replenishes electrolytes', cautions: 'Avoid if suffering from severe cold, congestion, or high Kapha' },
    { id: 24, name: 'Sesame Seeds', category: 'Seeds', serving_size: '15g', calories: 88, protein: 2.7, carbohydrates: 3.5, fat: 7.5, fiber: 1.8, sugar: 0.05, sodium: 1.6, calcium: 140, iron: 2.2, potassium: 70, vitamin_a: 1, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Bitter, Astringent', guna: 'Heavy, Oily, Warm', virya: 'Heating', vipaka: 'Sweet', dosha_effect: 'V- K- P+ (in excess)', benefits: 'Excellent for bones, provides healthy fats, warms the system', cautions: 'Use in moderation during summer or with high Pitta' },
    { id: 25, name: 'Sunflower Seeds', category: 'Seeds', serving_size: '15g', calories: 85, protein: 3, carbohydrates: 3, fat: 7.6, fiber: 1.3, sugar: 0.4, sodium: 1.4, calcium: 12, iron: 0.8, potassium: 100, vitamin_a: 0, vitamin_c: 0.2, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Astringent', guna: 'Light, Oily', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K=', benefits: 'Nutrient rich, healthy protein source, improves energy', cautions: 'Do not eat heavily salted seeds' },
    { id: 26, name: 'Olive Oil', category: 'Oils', serving_size: '10g', calories: 88, protein: 0, carbohydrates: 0, fat: 10, fiber: 0, sugar: 0, sodium: 0, calcium: 0, iron: 0, potassium: 0, vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet', guna: 'Oily, Heavy', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K+ (in excess)', benefits: 'Good cardiovascular fat, moisturizes the digestive tract', cautions: 'Do not overheat; keep below smoke point' },
    { id: 27, name: 'Warm Water', category: 'Beverages', serving_size: '250ml', calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, calcium: 0, iron: 0, potassium: 0, vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, rasa: 'None', guna: 'Light, Penetrating', virya: 'Heating', vipaka: 'None', dosha_effect: 'V- P- K- (Tridoshic)', benefits: 'Cleanses the gastrointestinal tract, kindles Agni, clears Ama', cautions: 'Do not drink piping hot; let it cool to a comfortable warm temperature' },
    { id: 28, name: 'Basmati Kitchari', category: 'Prepared Foods', serving_size: '200g', calories: 240, protein: 9, carbohydrates: 42, fat: 5, fiber: 6, sugar: 1, sodium: 150, calcium: 45, iron: 2.5, potassium: 350, vitamin_a: 50, vitamin_c: 2, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Astringent', guna: 'Light, Soft, Warm', virya: 'Neutral', vipaka: 'Sweet', dosha_effect: 'Tridoshic (V= P= K=)', benefits: 'Ultimate Ayurvedic healing food, completely balanced meal, easy on organs', cautions: 'None; excellent mono-diet for fasting/detox' },
    { id: 29, name: 'Coriander-Cumin-Fennel Tea (CCF)', category: 'Beverages', serving_size: '250ml', calories: 5, protein: 0.1, carbohydrates: 1, fat: 0.05, fiber: 0, sugar: 0, sodium: 1, calcium: 12, iron: 0.2, potassium: 25, vitamin_a: 0, vitamin_c: 0.1, vitamin_d: 0, vitamin_b12: 0, rasa: 'Sweet, Bitter, Pungent', guna: 'Light, Dry', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'Tridoshic (V= P= K=)', benefits: 'Gently stimulates digestion without overheating, flushes water retention', cautions: 'None' },
    { id: 30, name: 'Steamed Asparagus', category: 'Vegetables', serving_size: '100g', calories: 20, protein: 2.2, carbohydrates: 3.9, fat: 0.1, fiber: 2.1, sugar: 1.8, sodium: 2, calcium: 24, iron: 2.1, potassium: 202, vitamin_a: 38, vitamin_c: 5.6, vitamin_d: 0, vitamin_b12: 0, rasa: 'Bitter, Sweet', guna: 'Light, Oily', virya: 'Cooling', vipaka: 'Sweet', dosha_effect: 'V- P- K= (in moderation)', benefits: 'Strengthens kidneys, cooling, excellent prebiotic fiber', cautions: 'Avoid in severe kidney inflammation or raw state' }
  ];
}

module.exports = {
  query,
  initDb,
  isSQLite: () => isJSONdb
};
