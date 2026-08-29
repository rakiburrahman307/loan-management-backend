import express from 'express';
import auth from '../../middleware/auth';
import { ROLE_GROUPS } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import validateRequest from '../../middleware/validateRequest';
import { LoanValidation } from './loan.validation';
import { LoanController } from './loan.controller';

const router = express.Router();

const uploadFields = [
     {
          fieldName: 'certificateOfIncorporation',
          folderName: 'certificateOfIncorporation',
          fileType: 'documentOrImage' as const,
          maxCount: 1,
     },
     {
          fieldName: 'ownersPhotoId',
          folderName: 'ownersPhotoId',
          fileType: 'documentOrImage' as const,
          maxCount: 1,
     },
     {
          fieldName: 'bankStatements',
          folderName: 'bankStatements',
          fileType: 'documentOrImage' as const,
          maxCount: 10,
     },
     {
          fieldName: 'vatReturns',
          folderName: 'vatReturns',
          fileType: 'documentOrImage' as const,
          maxCount: 10,
     },
];

const upload = fileUploadHandler(uploadFields);
const parseFiles = parseFileData(
     'certificateOfIncorporation',
     'ownersPhotoId',
     { fieldName: 'bankStatements', forceMultiple: true },
     { fieldName: 'vatReturns', forceMultiple: true },
);

// Client/Borrower loan application routes

router.get('/', auth(...ROLE_GROUPS.USERS), LoanController.getLoans);
router.post(
     '/applications',
     auth(...ROLE_GROUPS.USERS),
     upload,
     parseFiles,
     validateRequest(LoanValidation.saveDraftZodSchema),
     LoanController.createOrSaveDraft,
);

router.put(
     '/applications/:id',
     auth(...ROLE_GROUPS.USERS),
     upload,
     parseFiles,
     validateRequest(LoanValidation.submitApplicationZodSchema),
     LoanController.submitApplication,
);

router.get('/applications', auth(...ROLE_GROUPS.USERS), LoanController.getApplications);
router.get('/active', auth(...ROLE_GROUPS.USERS), LoanController.getActiveLoan);
router.get('/client/funding', auth(...ROLE_GROUPS.USERS), LoanController.getClientFundingDetails);
router.get('/client/funding/history', auth(...ROLE_GROUPS.USERS), LoanController.getClientFundingHistory);

// Admin routes
router.get('/admin/applications', auth(...ROLE_GROUPS.ADMINS), LoanController.adminGetApplications);
router.get('/admin/applications-cards', auth(...ROLE_GROUPS.ADMINS), LoanController.adminGetApplicationsCards);
router.get(
     '/admin/applications/:id',
     auth(...ROLE_GROUPS.ADMINS),
     LoanController.adminGetApplicationById,
);
router.patch(
     '/admin/applications/:id/review',
     auth(...ROLE_GROUPS.ADMINS),
     validateRequest(LoanValidation.adminReviewZodSchema),
     LoanController.adminReviewApplication,
);
router.post(
     '/admin/loans/:id/disburse/retry',
     auth(...ROLE_GROUPS.ADMINS),
     LoanController.retryDisbursement,
);

export const LoanRouter = router;
