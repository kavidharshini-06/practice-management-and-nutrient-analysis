-- PostgreSQL Schema Setup

-- Users Table (Admins, Dietitians, Patients)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'dietitian', 'patient')),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dietitian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    date_of_birth DATE,
    gender VARCHAR(50),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    bmi DECIMAL(4,2),
    activity_level VARCHAR(50),
    allergies TEXT,
    dietary_restrictions TEXT,
    health_goal TEXT,
    current_diet TEXT,
    lifestyle_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ayurvedic Profiles Table
CREATE TABLE IF NOT EXISTS ayurvedic_profiles (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    prakriti VARCHAR(50) NOT NULL CHECK (prakriti IN ('Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha')),
    rasa_preference VARCHAR(255),
    lifestyle_notes TEXT,
    sleep_duration DECIMAL(3,1), -- hours
    exercise_level VARCHAR(50),
    stress_level VARCHAR(50),
    water_intake DECIMAL(3,1), -- liters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foods Table
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Grains', 'Fruits', 'Vegetables', 'Pulses', 'Nuts', 'Seeds', 'Dairy', 'Spices', 'Herbs', 'Oils', 'Beverages', 'Prepared Foods')),
    serving_size VARCHAR(100) NOT NULL, -- e.g., '100g', '1 cup'
    calories DECIMAL(6,2) DEFAULT 0,
    protein DECIMAL(5,2) DEFAULT 0,
    carbohydrates DECIMAL(5,2) DEFAULT 0,
    fat DECIMAL(5,2) DEFAULT 0,
    fiber DECIMAL(5,2) DEFAULT 0,
    sugar DECIMAL(5,2) DEFAULT 0,
    sodium DECIMAL(6,2) DEFAULT 0, -- mg
    calcium DECIMAL(6,2) DEFAULT 0, -- mg
    iron DECIMAL(5,2) DEFAULT 0, -- mg
    potassium DECIMAL(6,2) DEFAULT 0, -- mg
    vitamin_a DECIMAL(6,2) DEFAULT 0, -- mcg
    vitamin_c DECIMAL(6,2) DEFAULT 0, -- mg
    vitamin_d DECIMAL(6,2) DEFAULT 0, -- mcg
    vitamin_b12 DECIMAL(6,2) DEFAULT 0, -- mcg
    rasa VARCHAR(255),
    guna VARCHAR(255),
    virya VARCHAR(255),
    vipaka VARCHAR(255),
    dosha_effect VARCHAR(255),
    benefits TEXT,
    cautions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diet Plans Table
CREATE TABLE IF NOT EXISTS diet_plans (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    dietitian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    health_goal TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meals Table
CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    diet_plan_id INTEGER REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    meal_type VARCHAR(100) NOT NULL CHECK (meal_type IN ('Early Morning', 'Breakfast', 'Mid-Morning', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime')),
    notes TEXT
);

-- Meal Items Table
CREATE TABLE IF NOT EXISTS meal_items (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER REFERENCES meals(id) ON DELETE CASCADE,
    food_id INTEGER REFERENCES foods(id) ON DELETE RESTRICT,
    quantity DECIMAL(6,2) NOT NULL, -- in grams or portions matching serving_size
    calories DECIMAL(6,2) DEFAULT 0,
    protein DECIMAL(5,2) DEFAULT 0,
    carbohydrates DECIMAL(5,2) DEFAULT 0,
    fat DECIMAL(5,2) DEFAULT 0,
    fiber DECIMAL(5,2) DEFAULT 0
);

-- Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    dietitian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    consultation_date DATE NOT NULL,
    concerns TEXT,
    assessment TEXT,
    recommendations TEXT,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    dietitian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL, -- e.g., '10:00 AM'
    appointment_type VARCHAR(100) NOT NULL, -- e.g., 'First consultation', 'Follow-up'
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled')),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Records Table
CREATE TABLE IF NOT EXISTS progress_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL, -- kg
    bmi DECIMAL(4,2),
    water_intake DECIMAL(3,1), -- liters
    exercise VARCHAR(255),
    adherence VARCHAR(50), -- High, Medium, Low
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_dietitian ON patients(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_patient ON diet_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_progress_records_patient ON progress_records(patient_id);
