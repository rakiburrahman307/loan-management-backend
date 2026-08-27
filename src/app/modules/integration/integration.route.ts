import express from 'express';
import { apiKeyAuth } from '../../middleware/apiKeyAuth';
import { IntegrationController } from './integration.controller';

const router = express.Router();

router.post('/checkout/session', apiKeyAuth, IntegrationController.createCheckoutSession);

export const IntegrationRouter = router;
