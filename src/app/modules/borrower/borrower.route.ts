import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { BorrowerController } from './borrower.controller';

const router = express.Router();

// Borrower Client routes
router.get('/profile', auth(USER_ROLES.USER), BorrowerController.getProfile);
router.put('/profile', auth(USER_ROLES.USER), BorrowerController.updateProfile);

router.post('/integration/generate', auth(USER_ROLES.USER), BorrowerController.generateAPIKeys);
router.get('/integration', auth(USER_ROLES.USER), BorrowerController.getIntegration);

// Admin routes
router.get('/admin/borrowers', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), BorrowerController.adminGetBorrowers);
router.get('/admin/borrowers-cards', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), BorrowerController.adminGetBorrowersCards);
router.get('/admin/borrowers/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), BorrowerController.adminGetBorrowerById);

export const BorrowerRouter = router;
