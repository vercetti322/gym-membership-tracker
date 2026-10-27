import { Context } from 'hono';
import {
  GET_ALL_MEMBERS,
  RENEW_MEMBER_PLAN,
  GET_A_MEMBER,
  MARK_INACTIVE,
  SAVE_MEMBER_PHOTO,
  INSERT_MEMBER,
  GET_MEMBER_PHOTO,
  INSERT_MEMBER_PLAN,
} from './queries';
import { MemberRow } from './types';

export const getAllMembers = async (c: Context) => {
  const { results } = await c.env.gym_tracker_db.prepare(GET_ALL_MEMBERS).all();

  return c.json(
    results.map((row: MemberRow) => ({
      ...row,
      hasPhoto: row.hasPhoto === 1,
      paymentDone: row.paymentDone === 1,
      isActive: row.isActive === 1,
    })),
  );
};

export const createNewMember = async (c: Context) => {
  const { name, phone, startDate, endDate, planDuration, paymentMode } =
    await c.req.json<{
      name: string;
      phone: string;
      startDate: string;
      endDate: string;
      planDuration: number;
      paymentMode: 'UPI' | 'Cash' | 'Other';
    }>();

  const price = 1000 + planDuration * 500;
  const db = c.env.gym_tracker_db;

  const results = await db.batch([
    db.prepare(INSERT_MEMBER).bind(name, phone),
    db
      .prepare(INSERT_MEMBER_PLAN)
      .bind(planDuration, price, startDate, endDate, paymentMode, phone),
  ]);

  return c.json(
    {
      message: 'Member created successfully',
      memberId: results[0].meta.last_row_id,
    },
    201,
  );
};

export const renewMemberPlan = async (c: Context) => {
  const memberId = Number(c.req.param('id'));
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return c.json({ error: 'Invalid Member ID' }, 400);
  }

  const { startDate, endDate, planDuration, paymentMode } = await c.req.json<{
    startDate: string;
    endDate: string;
    planDuration: number;
    paymentMode: 'UPI' | 'Cash' | 'Other';
  }>();

  const price = 1000 + planDuration * 500;
  const result = await c.env.gym_tracker_db
    .prepare(RENEW_MEMBER_PLAN)
    .bind(memberId, planDuration, price, startDate, endDate, paymentMode)
    .run();

  return c.json(
    {
      message: 'Member plan renewed successfully',
      auditId: result.meta.last_row_id,
    },
    201,
  );
};

export const updateMemberDetails = async (c: Context) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid Member ID' }, 400);
  }

  const result = await c.env.gym_tracker_db
    .prepare(MARK_INACTIVE)
    .bind(id)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Member not found' }, 404);
  }

  return c.json({ message: 'Member marked inactive successfully!' }, 200);
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

export const saveMemberPhoto = async (c: Context) => {
  const id = Number(c.req.param('id'));

  if (!Number.isSafeInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid Member ID' }, 400);
  }

  const contentType = c.req.header('content-type')?.trim().toLowerCase();

  console.log('Received photo Content-Type:', contentType);

  if (contentType !== 'image/jpeg') {
    return c.json(
      {
        error: `Expected image/jpeg, received: ${contentType ?? 'missing'}`,
      },
      415,
    );
  }

  const contentLength = Number(c.req.header('content-length'));

  if (contentLength > 1024 * 1024) {
    return c.json({ error: 'Photo exceeds the 1 MB limit' }, 413);
  }

  const photo = await c.req.arrayBuffer();

  if (photo.byteLength === 0) {
    return c.json({ error: 'Photo cannot be empty' }, 400);
  }

  if (photo.byteLength > 1024 * 1024) {
    return c.json({ error: 'Photo exceeds the 1 MB limit' }, 413);
  }

  const result = await c.env.gym_tracker_db
    .prepare(SAVE_MEMBER_PHOTO)
    .bind(new Uint8Array(photo), id)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Active member not found' }, 404);
  }

  return c.json({ message: 'Photo saved successfully' });
};

export const getMemberPhoto = async (c: Context) => {
  const id = Number(c.req.param('id'));

  if (!Number.isSafeInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid Member ID' }, 400);
  }

  const result = (await c.env.gym_tracker_db
    .prepare(GET_MEMBER_PHOTO)
    .bind(id)
    .first()) as { photo_data: number[] | null } | null;

  if (!result?.photo_data) {
    return c.json({ error: 'Member photo not found' }, 404);
  }

  const bytes = new Uint8Array(result.photo_data);

  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
