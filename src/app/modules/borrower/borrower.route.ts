import express from 'express';
import auth from '../../middleware/auth';
import { ROLE_GROUPS } from '../../../enums/user';
import { BorrowerController } from './borrower.controller';

const router = express.Router();

// Borrower Client routes
router.get('/client-info', auth(...ROLE_GROUPS.USERS), BorrowerController.getProfile);
router.put('/update/client-info', auth(...ROLE_GROUPS.USERS), BorrowerController.updateProfile);

router.post(
     '/integration/generate',
     auth(...ROLE_GROUPS.USERS),
     BorrowerController.generateAPIKeys,
);
router.get('/integration', auth(...ROLE_GROUPS.USERS), BorrowerController.getIntegration);

// Admin routes
router.get('/admin/borrowers', auth(...ROLE_GROUPS.ADMINS), BorrowerController.adminGetBorrowers);
router.get(
     '/admin/borrowers-cards',
     auth(...ROLE_GROUPS.ADMINS),
     BorrowerController.adminGetBorrowersCards,
);
router.get(
     '/admin/borrowers/:id',
     auth(...ROLE_GROUPS.ADMINS),
     BorrowerController.adminGetBorrowerById,
);

export const BorrowerRouter = router;
