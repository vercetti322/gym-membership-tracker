import { useState } from 'react';
import {
  Button,
  Image,
  Modal,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import type { Member } from '../types';
import {
  canRenew,
  getPlanEndDate,
  getTodayDate,
  planMonthOptions,
  plural,
} from '../utils/MemberUtils';

const renewHint = (m: Member) => {
  const d = m.daysLeft;
  if (d === null) return 'No plan yet';
  return `Wait for ${d} ${plural(d)}`;
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
  const [months, setMonths] = useState(1);

  const enabled = canRenew(member);
  const isRenew = action === 'renew';
  const endDate = getPlanEndDate(from, months);

  const open = () => {
    const start = getTodayDate();
    setAction('renew');
    setMode('UPI');
    setFrom(start);
    setMonths(Math.min(Math.max(member.planMonths ?? 1, 1), 12));
    setOpened(true);
  };

  const confirm = async () => {
    if (isRenew) {
      await renewPlan();
    } else {
      await markInactive();
    }
  };

  const renewPlan = async () => {
    if (!from || !endDate) return;

    try {
      const response = await fetch(`/api/members/${member.id}/renewals`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: from,
          endDate,
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
          <Button
            color="blue"
            autoContrast
            size="sm"
            fz="sm"
            h={40}
            disabled={!enabled}
            onClick={open}
          >
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
        size="500px"
        radius="lg"
        padding="md"
      >
        <Stack gap="md">
          <SegmentedControl
            color="blue"
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
              <SimpleGrid cols={2} spacing="xs">
                <DatePickerInput
                  label="Start date"
                  valueFormat="DD MMM YYYY"
                  value={from}
                  onChange={setFrom}
                  size="md"
                  clearable={false}
                  styles={{
                    input: { fontSize: '13.9px' },
                  }}
                />

                <Select
                  label="Months"
                  data={planMonthOptions}
                  value={String(months)}
                  onChange={(value) => value && setMonths(Number(value))}
                  comboboxProps={{ width: 'target' }}
                  allowDeselect={false}
                  size="md"
                />
              </SimpleGrid>

              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Payment method
                </Text>

                <SegmentedControl
                  color="blue"
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
                  className="payment-qr"
                />
              )}

              <Button
                color="orange"
                autoContrast
                fullWidth
                size="md"
                radius="md"
                disabled={!endDate}
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
                variant="outline"
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
