import { Router } from 'express';
import {
  deleteUser,
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
} from '../controller/admin.controller.js';

const router = Router();

// Routes for Admin Dashboard
router.get('/stats', getAdminStats);

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .delete(deleteUser);

router.patch('/users/:id/status', toggleUserStatus);

export default router;