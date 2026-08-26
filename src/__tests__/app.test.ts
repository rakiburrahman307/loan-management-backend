// src/__tests__/app.test.ts

import request from 'supertest';
import app from '../app';

describe('GET /api/v1', () => {
     it('should return 200 OK with a welcome message', async () => {
          const response = await request(app).get('/api/v1');

          // পরীক্ষা করা হচ্ছে যে স্ট্যাটাস কোড 200 কিনা
          expect(response.statusCode).toBe(200);

          // পরীক্ষা করা হচ্ছে যে রেসপন্স বডিতে একটি নির্দিষ্ট টেক্সট আছে কিনা
          // আপনার রুটের রেসপন্স অনুযায়ী এই টেক্সট পরিবর্তন করতে পারেন
          expect(response.text).toContain('Welcome to  my backend');
     });
});

describe('GET /a-non-existent-route', () => {
     it('should return 404 Not Found', async () => {
          const response = await request(app).get('/this-route-does-not-exist');
          expect(response.statusCode).toBe(404);
     });
});
