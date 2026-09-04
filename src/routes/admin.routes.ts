import { Router } from 'express';
import { deleteUser, getAdminStats, getAllUsers, toggleUserStatus } from '../controller/admin.controller.js';

const router = Router();

// Routes for Admin Special Module
router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

export default router;