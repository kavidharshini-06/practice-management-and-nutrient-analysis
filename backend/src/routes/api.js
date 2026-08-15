const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const patientController = require('../controllers/patientController');
const foodController = require('../controllers/foodController');
const dietPlanController = require('../controllers/dietPlanController');
const appointmentController = require('../controllers/appointmentController');
const consultationController = require('../controllers/consultationController');
const progressController = require('../controllers/progressController');
const adminController = require('../controllers/adminController');

const { authenticateToken, requireRole } = require('../middleware/auth');

// ==========================================
// Public Authentication Routes
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// ==========================================
// Protected Routes (Require Authentication)
// ==========================================
router.use(authenticateToken);

// --- Patients Routes ---
router.get('/patients', patientController.getAllPatients);
router.get('/patients/:id', patientController.getPatientById);
router.post('/patients', requireRole(['admin', 'dietitian']), patientController.createPatient);
router.put('/patients/:id', requireRole(['admin', 'dietitian', 'patient']), patientController.updatePatient);
router.delete('/patients/:id', requireRole(['admin', 'dietitian']), patientController.deletePatient);

// --- Foods Routes ---
router.get('/foods', foodController.getAllFoods);
router.get('/foods/:id', foodController.getFoodById);
router.post('/foods', requireRole(['admin', 'dietitian']), foodController.createFood);
router.put('/foods/:id', requireRole(['admin', 'dietitian']), foodController.updateFood);
router.delete('/foods/:id', requireRole(['admin', 'dietitian']), foodController.deleteFood);

// --- Diet Plans Routes ---
router.get('/diet-plans', dietPlanController.getAllDietPlans);
router.get('/diet-plans/:id', dietPlanController.getDietPlanById);
router.post('/diet-plans', requireRole(['admin', 'dietitian']), dietPlanController.createDietPlan);
router.put('/diet-plans/:id', requireRole(['admin', 'dietitian']), dietPlanController.updateDietPlan);
router.delete('/diet-plans/:id', requireRole(['admin', 'dietitian']), dietPlanController.deleteDietPlan);

// --- Appointments Routes ---
router.get('/appointments', appointmentController.getAllAppointments);
router.post('/appointments', requireRole(['admin', 'dietitian', 'patient']), appointmentController.createAppointment);
router.put('/appointments/:id', requireRole(['admin', 'dietitian', 'patient']), appointmentController.updateAppointment);
router.delete('/appointments/:id', requireRole(['admin', 'dietitian']), appointmentController.deleteAppointment);

// --- Consultations Routes ---
router.get('/consultations', consultationController.getAllConsultations);
router.post('/consultations', requireRole(['admin', 'dietitian']), consultationController.createConsultation);
router.put('/consultations/:id', requireRole(['admin', 'dietitian']), consultationController.updateConsultation);

// --- Progress Tracking Routes ---
router.get('/progress/:patientId', progressController.getProgressByPatientId);
router.post('/progress', requireRole(['admin', 'dietitian', 'patient']), progressController.createProgressRecord);

// --- Admin-Only Management Routes ---
router.get('/admin/stats', requireRole(['admin']), adminController.getSystemStats);
router.get('/admin/dietitians', requireRole(['admin']), adminController.getDietitians);
router.get('/admin/users', requireRole(['admin']), adminController.getUsers);
router.post('/admin/dietitians', requireRole(['admin']), adminController.createDietitian);
router.put('/admin/users/:id', requireRole(['admin', 'dietitian', 'patient']), adminController.updateUser);
router.delete('/admin/users/:id', requireRole(['admin']), adminController.deleteUser);

module.exports = router;
