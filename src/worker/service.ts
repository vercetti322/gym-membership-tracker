import { Context } from 'hono';
import { GET_ALL_MEMBERS } from './queries';
import { MemberRow } from './types';

export const getAllMembers = async (c: Context) => {
  const { results } = await c.env.gym_tracker_db.prepare(GET_ALL_MEMBERS).all();
  return c.json(
    results.map((row: MemberRow) => ({
      ...row,
      paymentDone: row.paymentDone == 1,
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
  console.log(c);
};
