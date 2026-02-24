import request from 'supertest';
import { app } from '../../src/app';

describe('evaluation routes', () => {
  it('requires auth', async () => {
    await request(app)
      .patch('/api/ideas/abc/status')
      .set('If-Match', '0')
      .send({ toStatus: 'Under Review' })
      .expect(401);
  });
});
