import { useState } from 'react';
import {
  Button,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
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

export default function RenewButton({ member }: { readonly member: Member }) {
  const [opened, setOpened] = useState(false);
  const [action, setAction] = useState('renew'); // 'renew' | 'inactive'
  const [mode, setMode] = useState('UPI');
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const enabled = canRenew(member);
  const validRange = from !== null && to !== null && !dayjs(to).isBefore(from);
  const isRenew = action === 'renew';

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

  const confirm = () => {
    if (isRenew) {
      console.log('Renew', member.name, mode, from, to); // real API call comes later
    } else {
      console.log('Mark inactive', member.name); // real API call comes later
    }
    setOpened(false);
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
          <Text fz={22} fw={700}>
            {member.name}
          </Text>
        }
        centered
        size="sm"
      >
        <Stack>
          <SegmentedControl
            fullWidth
            value={action}
            onChange={setAction}
            data={[
              { label: 'Renew', value: 'renew' },
              { label: 'Mark inactive', value: 'inactive' },
            ]}
          />

          {isRenew ? (
            <>
              <Group grow wrap="nowrap" gap="xs">
                <DatePickerInput
                  label="From"
                  valueFormat="DD MMM YYYY"
                  value={from}
                  onChange={onFromChange}
                />
                <DatePickerInput
                  label="To"
                  valueFormat="DD MMM YYYY"
                  value={to}
                  onChange={setTo}
                  minDate={from ?? undefined}
                />
              </Group>
              <Text size="sm" c="dimmed">
                How was the payment received?
              </Text>
              <SegmentedControl
                fullWidth
                value={mode}
                onChange={setMode}
                data={['UPI', 'Cash']}
              />

              {mode === 'UPI' && (
                <>
                  {/* UPI QR image goes here, e.g. <Image src="/upi-qr.png" w={200} mx="auto" /> */}
                </>
              )}

              <Button disabled={!validRange} onClick={confirm}>
                Confirm renewal
              </Button>
            </>
          ) : (
            <>
              <Text size="sm" c="dimmed">
                {member.name} will be hidden from the member list and from
                reminders. Their plan and payment history are kept.
              </Text>
              <Button color="red" onClick={confirm}>
                Mark inactive
              </Button>
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}
