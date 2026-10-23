import { useState } from 'react';
import {
  Button,
  Image,
  Modal,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import dayjs from 'dayjs';
import type { Member } from '../types';
import { canRenew, plural } from '../utils/MemberUtils';

const FORMAT = 'YYYY-MM-DD';

const renewHint = (m: Member) => {
  const d = m.daysLeft;
  if (d === null) return 'No plan yet';
  return `Wait for ${d} ${plural(d)}`;
};

// the day after the old plan ended, but never in the past
const defaultFrom = (m: Member) => {
  const today = dayjs();
  const next = m.expiry ? dayjs(m.expiry).add(1, 'day') : today;
  return (next.isAfter(today, 'day') ? next : today).format(FORMAT);
};

// start + plan months - 1 day, so a 1-month plan has no extra day
const defaultTo = (from: string, months: number | null) =>
  dayjs(from)
    .add(months ?? 1, 'month')
    .subtract(1, 'day')
    .format(FORMAT);

const calculateMonths = (from: string | null, to: string | null) => {
  if (!from || !to || dayjs(to).isBefore(from, 'day')) return 0;

  const start = dayjs(from);
  const end = dayjs(to);

  const wholeMonths = end.diff(start, 'month');
  const remainderDays = end.diff(start.add(wholeMonths, 'month'), 'day');

  return wholeMonths + (remainderDays > 15 ? 1 : 0);
};

export default function RenewButton({
  member,
  onUpdated,
}: {
  readonly member: Member;
  readonly onUpdated: () => Promise<void>;
}) {
  const [opened, setOpened] = useState(false);
  const [action, setAction] = useState('renew'); // 'renew' | 'inactive'
  const [mode, setMode] = useState('UPI');
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const enabled = canRenew(member);
  const validRange =
    from !== null && to !== null && dayjs(to).diff(dayjs(from), 'day') > 15;
  const isRenew = action === 'renew';
  const months = calculateMonths(from, to);

  const open = () => {
    const start = defaultFrom(member);
    setAction('renew');
    setMode('UPI');
    setFrom(start);
    setTo(defaultTo(start, member.planMonths));
    setOpened(true);
  };

  const onFromChange = (value: string | null) => {
    setFrom(value);
    // moving the start date moves the end date by the same plan length
    if (value) setTo(defaultTo(value, member.planMonths));
  };

  const confirm = async () => {
    if (isRenew) {
      await renewPlan();
    } else {
      await markInactive();
    }
  };

  const renewPlan = async () => {
    if (!from || !to || months <= 0) return;

    try {
      const response = await fetch(`/api/members/${member.id}/renewals`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: from,
          endDate: to,
          planDuration: months,
          paymentMode: mode,
        }),
      });

      const data: { message?: string; error?: string } = await response.json();

      if (!response.ok) {
        alert(data.error ?? 'Failed to renew member plan');
        return;
      }

      setOpened(false);
      await onUpdated();
    } catch {
      alert('Unable to connect to the server. Please try again.');
    }
  };

  const markInactive = async () => {
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      const data: { message?: string; error?: string } = await response.json();

      if (!response.ok) {
        alert(data.error ?? 'Failed to mark member inactive');
        return;
      }

      setOpened(false);
      await onUpdated();
    } catch {
      alert('Unable to connect to the server. Please try again.');
    }
  };

  return (
    <>
      <Tooltip
        label={renewHint(member)}
        disabled={enabled}
        events={{ hover: true, focus: true, touch: true }}
      >
        <div>
          <Button size="xs" disabled={!enabled} onClick={open}>
            Update
          </Button>
        </div>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Text fz="xl" fw={700}>
            {member.name}
          </Text>
        }
        centered
        size="sm"
        radius="lg"
        padding="md"
      >
        <Stack gap="lg">
          <SegmentedControl
            fullWidth
            value={action}
            onChange={setAction}
            data={[
              { label: 'Renew', value: 'renew' },
              { label: 'Deactivate', value: 'inactive' },
            ]}
          />

          {isRenew ? (
            <>
              <SimpleGrid cols={3} spacing="sm">
                <DatePickerInput
                  label="Start date"
                  valueFormat="DD MMM YYYY"
                  value={from}
                  onChange={onFromChange}
                  size="md"
                  clearable={false}
                  styles={{
                    input: { fontSize: '12px' },
                  }}
                />

                <DatePickerInput
                  label="End date"
                  valueFormat="DD MMM YYYY"
                  value={to}
                  onChange={setTo}
                  minDate={from ?? undefined}
                  size="md"
                  clearable={false}
                  styles={{
                    input: { fontSize: '12px' },
                  }}
                />

                <TextInput
                  label="Duration"
                  value={`${months} ${months === 1 ? 'month' : 'months'}`}
                  readOnly
                  size="md"
                  styles={{
                    input: {
                      fontSize: '12px',
                      fontWeight: 500,
                    },
                  }}
                />
              </SimpleGrid>

              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Payment method
                </Text>

                <SegmentedControl
                  fullWidth
                  value={mode}
                  onChange={setMode}
                  data={[
                    { label: 'UPI', value: 'UPI' },
                    { label: 'Cash', value: 'Cash' },
                  ]}
                />
              </Stack>

              {mode === 'UPI' && (
                <Image
                  src="/upi_qr.png"
                  alt="UPI payment QR code"
                  w={180}
                  h={180}
                  fit="contain"
                  mx="auto"
                />
              )}

              <Button
                fullWidth
                size="md"
                radius="md"
                disabled={!validRange}
                onClick={confirm}
              >
                Confirm renewal
              </Button>
            </>
          ) : (
            <Stack gap="md">
              <Text size="sm" c="dimmed" lh={1.5}>
                Deactivating removes the member from the active member list and
                payment reminders.
              </Text>

              <Button
                fullWidth
                color="red"
                size="md"
                radius="md"
                onClick={confirm}
              >
                Deactivate member
              </Button>
            </Stack>
          )}
        </Stack>
      </Modal>
    </>
  );
}
