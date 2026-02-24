import request from 'supertest';
import { app } from '../../src/app';

describe('idea routes', () => {
  it('requires auth for listing ideas', async () => {
    await request(app).get('/api/ideas').expect(401);
  });
});
