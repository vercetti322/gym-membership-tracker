import { Context } from 'hono';
import { GET_ALL_MEMBERS, GET_A_MEMBER } from './queries';
import { MemberRow } from './types';

export const getAllMembers = async (c: Context) => {
  const { results } = await c.env.gym_tracker_db.prepare(GET_ALL_MEMBERS).all();

  return c.json(
    results.map((row: MemberRow) => ({
      ...row,
      paymentDone: row.paymentDone === 1,
      isActive: row.isActive === 1,
    })),
  );
};

export const createNewMember = async (c: Context) => {
  console.log(c);
};

export const renewMemberPlan = async (c: Context) => {
  console.log(c);
};

export const deleteMember = async (c: Context) => {
  console.log(c);
};

export const updateMemberDetails = async (c: Context) => {
  console.log(c);
};

export const getMember = async (c: Context) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid Member ID' }, 400);
  }

  const result = (await c.env.gym_tracker_db
    .prepare(GET_A_MEMBER)
    .bind(id)
    .first()) as MemberRow | null;

  if (!result) {
    return c.json({ error: 'Member not found' }, 404);
  }

  return c.json({
    ...result,
    paymentDone: result.paymentDone === 1,
    isActive: result.isActive === 1,
  });
};
