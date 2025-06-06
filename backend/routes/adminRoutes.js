import express from 'express';
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/adminUsersController.js';
import {
  getAllSubscriptions,
  adminCancelSubscription,
  adminResumeSubscription,
} from '../controllers/adminSubscriptionController.js';

const router = express.Router();

// List users, update role, and delete user (Super Admins only)
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);
// Subscription management for Admins and Super Admins
router.get('/subscriptions', getAllSubscriptions);
router.post('/subscriptions/:email/cancel', adminCancelSubscription);
router.post('/subscriptions/:email/resume', adminResumeSubscription);

export default router;