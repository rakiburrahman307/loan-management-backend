import crypto from 'crypto';
import { Integration } from '../app/modules/integration/integration.model';
import { logger } from '../shared/logger';

export const dispatchMerchantWebhook = async (
     borrowerUserId: string,
     event: string,
     payload: Record<string, any>,
) => {
     try {
          const integration = await Integration.findOne({ userId: borrowerUserId, isActive: true });
          if (!integration) {
               logger.warn(`No active B2B integration found for borrower user ${borrowerUserId}. Webhook dispatch skipped.`);
               return;
          }

          const targetUrl = integration.webhookUrl;

          if (!targetUrl) {
               logger.warn(`No webhook target URL configured for borrower user ${borrowerUserId}. Webhook dispatch skipped.`);
               return;
          }

          const webhookBody = {
               event,
               timestamp: new Date(),
               data: payload,
          };

          const rawBody = JSON.stringify(webhookBody);
          const signature = crypto
               .createHmac('sha256', integration.webhookSecret)
               .update(rawBody)
               .digest('hex');

          logger.info(`Dispatching B2B Webhook '${event}' to: ${targetUrl}`);

          const response = await fetch(targetUrl, {
               method: 'POST',
               headers: {
                    'Content-Type': 'application/json',
                    'x-lm-signature': signature,
               },
               body: rawBody,
          });

          if (!response.ok) {
               logger.error(`B2B Webhook dispatch failed. Status: ${response.status} ${response.statusText}`);
          } else {
               logger.info(`B2B Webhook '${event}' successfully delivered to merchant store.`);
          }
     } catch (error: any) {
          logger.error('Failed to dispatch merchant webhook:', error);
     }
};
