import { Hono } from 'hono';
import {
  getAllMembers,
  createNewMember,
  renewMemberPlan,
  deleteMember,
  updateMemberDetails,
  getMember,
} from './service';
import { login, logout, requireAuth } from './auth';

const app = new Hono<{ Bindings: Env }>();

// Public Auth Routes
app.post('/api/login', login);

app.post('/api/logout', logout);

// Protect all API routes
app.use('/api/*', requireAuth);

// Verify current session
app.get('/api/auth/me', (c) => {
  return c.json({ authenticated: true });
});

// Get all existing members
app.get('/api/members', (c) => getAllMembers(c));

// Get a specific member
app.get('/api/memebers/:id', (c) => getMember(c));

// Create a new member with plan
app.post('/api/members', (c) => createNewMember(c));

// Renew a member with plan
app.post('/api/members/:id/renewals', (c) => renewMemberPlan(c));

// Delete a specific member
app.delete('/api/members/:id', (c) => deleteMember(c));

// Update details for a specific member
app.patch('/api/members/:id', (c) => updateMemberDetails(c));

export default app;
