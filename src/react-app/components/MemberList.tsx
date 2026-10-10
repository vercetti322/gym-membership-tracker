import { useState } from 'react';
import {
  Accordion,
  Anchor,
  Badge,
  Group,
  Pagination,
  Stack,
  Button,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import type { Member } from '../types';

const PAGE_SIZE = 7;
const plural = (n: number) => (n === 1 ? 'day' : 'days');

const status = (member: Member) => {
  const d = member.daysLeft;

  if (d === null) {
    return { text: 'No plan', color: 'gray' };
  }

  // Payment received: show remaining membership duration.
  if (member.paymentDone) {
    if (d < 0) {
      return { text: 'Expired', color: 'gray' };
    }

    return {
      text: `${d} ${plural(d)} left`,
      color: 'green',
    };
  }

  // Payment pending: show how overdue it is.
  if (d < 0) {
    const late = Math.abs(d);
    return {
      text: `${late} ${plural(late)} late`,
      color: 'red',
    };
  } else if (d === 0) {
    return {
      text: `Due Today`,
      color: 'red',
    };
  }

  return {
    text: `${d} ${plural(d)} left`,
    color: 'green',
  };
};

const renewHint = (member: Member) => {
  const d = member.daysLeft;
  if (d === null) return 'No plan yet';
  if (!member.paymentDone) return 'Please complete your payment';
  return `Wait for ${d} ${plural(d)}`;
};

export default function MemberList({
  dueOnly,
  members,
}: {
  readonly dueOnly: boolean;
  readonly members: Member[];
}) {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300);

  const q = debouncedQuery.trim().toLowerCase();
  const filtered = members.filter(
    (m) =>
      (!dueOnly || (m.daysLeft !== null && !m.paymentDone)) &&
      m.name.toLowerCase().includes(q),
  );

  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    setOpenId(null);
  };

  const onSearch = (value: string) => {
    setQuery(value);
    goTo(1);
  };

  const handleRenew = (m: Member) => {
    console.log('Renew', m.name); // real logic comes later
  };

  const handlePay = (m: Member) => {
    console.log('Pay', m.name); // real logic comes later
  };

  return (
    <Stack w="100%" gap="sm" mih={560}>
      <TextInput
        placeholder="Search by name"
        value={query}
        onChange={(e) => onSearch(e.currentTarget.value)}
      />

      {visible.length === 0 && (
        <Text ta="center" c="dimmed">
          {dueOnly ? 'No pending payments' : 'No members found'}
        </Text>
      )}

      <Accordion
        variant="separated"
        radius="md"
        value={openId}
        onChange={setOpenId}
      >
        {visible.map((m) => {
          const s = status(m);
          const hasPlan = m.daysLeft !== null;
          const canRenew =
            m.daysLeft !== null && m.daysLeft <= 0 && m.paymentDone;
          const planLabel = `${m.planMonths === 1 ? 'month' : 'months'}`;

          return (
            <Accordion.Item key={m.id} value={String(m.id)}>
              <Group wrap="nowrap" gap={0} pr="xs">
                <Accordion.Control style={{ flex: 1 }}>
                  <Group justify="space-between" wrap="nowrap" pr="xs">
                    <Text size="md" fw={400}>
                      {m.name}
                    </Text>
                    <Badge color={s.color} variant="light">
                      {s.text}
                    </Badge>
                  </Group>
                </Accordion.Control>

                <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <Tooltip
                    label={hasPlan ? 'Payment already received' : 'No plan yet'}
                    disabled={hasPlan && !m.paymentDone}
                    events={{ hover: true, focus: true, touch: true }}
                  >
                    <div>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={!hasPlan || m.paymentDone}
                        onClick={() => handlePay(m)}
                      >
                        Pay
                      </Button>
                    </div>
                  </Tooltip>

                  <Tooltip
                    label={renewHint(m)}
                    disabled={canRenew}
                    events={{ hover: true, focus: true, touch: true }}
                  >
                    <div>
                      <Button
                        size="xs"
                        disabled={!canRenew}
                        onClick={() => handleRenew(m)}
                      >
                        Renew
                      </Button>
                    </div>
                  </Tooltip>
                </Group>
              </Group>

              <Accordion.Panel>
                <Stack gap={6}>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Phone:
                    </Text>
                    <Anchor size="sm" href={`tel:${m.phone}`}>
                      {m.phone}
                    </Anchor>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Plan:
                    </Text>
                    <Text size="sm">
                      {m.planMonths === null
                        ? 'No plan'
                        : `${m.planMonths} ${planLabel}`}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Payment Date:
                    </Text>
                    <Text size="sm">
                      {m.paymentDate === null
                        ? '-'
                        : `${m.paymentDate} by ${m.paymentMode}`}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Expires:
                    </Text>
                    <Text size="sm">{m.expiry ?? '-'}</Text>
                  </Group>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>

      <Group justify="center" mt="xs">
        <Pagination total={pages} value={page} onChange={goTo} size="sm" />
      </Group>
    </Stack>
  );
}
