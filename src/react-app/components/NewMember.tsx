import { useState } from 'react';
import {
  Button,
  Modal,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import dayjs from 'dayjs';

const FORMAT = 'YYYY-MM-DD';

const defaultTo = (from: string) =>
  dayjs(from).add(1, 'month').subtract(1, 'day').format(FORMAT);

const calculateMonths = (from: string | null, to: string | null) => {
  if (!from || !to || dayjs(to).isBefore(from, 'day')) return 0;

  const start = dayjs(from);
  const end = dayjs(to);

  const wholeMonths = end.diff(start, 'month');
  const remainderDays = end.diff(start.add(wholeMonths, 'month'), 'day');

  return wholeMonths + (remainderDays > 15 ? 1 : 0);
};

export default function CreateMemberButton({
  onCreated,
}: {
  readonly onCreated: () => Promise<void>;
}) {
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState('UPI');
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const months = calculateMonths(from, to);

  const validRange =
    from !== null && to !== null && dayjs(to).diff(dayjs(from), 'day') > 15;

  const open = () => {
    const start = dayjs().format(FORMAT);

    setName('');
    setPhone('');
    setMode('UPI');
    setFrom(start);
    setTo(defaultTo(start));
    setOpened(true);
  };

  const onFromChange = (value: string | null) => {
    setFrom(value);
    if (value) setTo(defaultTo(value));
  };

  const createMember = async () => {
    if (!name.trim() || !phone.trim() || !from || !to || months <= 0) {
      return;
    }

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          startDate: from,
          endDate: to,
          planDuration: months,
          paymentMode: mode,
        }),
      });

      const data: { message?: string; error?: string } = await response.json();

      if (!response.ok) {
        alert(data.error ?? 'Failed to create member');
        return;
      }

      setOpened(false);
      await onCreated();
    } catch {
      alert('Unable to connect to the server. Please try again.');
    }
  };

  return (
    <>
      <Button onClick={open}>New Member</Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Text fz="xl" fw={700}>
            New Member
          </Text>
        }
        centered
        size="sm"
        radius="lg"
        padding="md"
      >
        <Stack gap="lg">
          <Stack gap="sm">
            <TextInput
              placeholder="Enter full name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              size="md"
              required
            />

            <TextInput
              placeholder="Enter phone number"
              value={phone}
              onChange={(event) => setPhone(event.currentTarget.value)}
              size="md"
              inputMode="numeric"
              maxLength={10}
              required
            />
          </Stack>

          <SimpleGrid cols={3} spacing="sm">
            <DatePickerInput
              label="Start date"
              valueFormat="DD MMM YYYY"
              value={from}
              onChange={onFromChange}
              size="md"
              clearable={false}
              styles={{
                input: { fontSize: '11px' },
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
                input: { fontSize: '11px' },
              }}
            />

            <TextInput
              label="Duration"
              value={`${months} ${months === 1 ? 'month' : 'months'}`}
              readOnly
              size="md"
              styles={{
                input: {
                  fontSize: '11px',
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

          {mode === 'UPI' && <>{/* UPI QR image goes here */}</>}

          <Button
            fullWidth
            size="md"
            radius="md"
            disabled={
              !name.trim() ||
              !phone.trim() ||
              !validRange ||
              !/^\d{10}$/.test(phone)
            }
            onClick={createMember}
          >
            Create member
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
