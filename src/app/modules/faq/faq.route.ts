import express from 'express';
import { ROLE_GROUPS } from '../../../enums/user';
import { FaqController } from './faq.controller';
import { FaqValidation } from './faq.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
const router = express.Router();

router.post(
     '/create',
     validateRequest(FaqValidation.createFaqZodSchema),
     auth(...ROLE_GROUPS.ADMINS),
     FaqController.createFaq,
);

router.get('/public', auth(...ROLE_GROUPS.ALL), FaqController.getFaqs);
router.get('/', auth(...ROLE_GROUPS.ADMINS), FaqController.getFaqs);

router.delete('/delete/:id', auth(...ROLE_GROUPS.ADMINS), FaqController.deleteFaq);
router.patch('/update/:id', auth(...ROLE_GROUPS.ADMINS), FaqController.updateFaq);

export const FaqRoutes = router;
