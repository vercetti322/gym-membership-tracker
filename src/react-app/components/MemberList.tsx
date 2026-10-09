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

type Member = {
  id: number;
  name: string;
  phone: string;
  plan: string;
  expiry: string;
  daysLeft: number;
  paymentDone: boolean;
};

const base: Member[] = [
  {
    id: 1,
    name: 'Rahul Sharma',
    phone: '9876543210',
    plan: '3 months',
    expiry: '2026-10-20',
    daysLeft: 1,
    paymentDone: true,
  },
  {
    id: 2,
    name: 'Anil Kumar',
    phone: '9812345678',
    plan: '1 month',
    expiry: '2026-11-02',
    daysLeft: 0,
    paymentDone: false,
  },
  {
    id: 3,
    name: 'Priya Singh',
    phone: '9988776655',
    plan: '12 months',
    expiry: '2026-10-09',
    daysLeft: -5,
    paymentDone: false,
  },
];

const members: Member[] = Array.from({ length: 10 }, (_, i) => ({
  ...base[i % 3],
  id: i + 1,
}));

const PAGE_SIZE = 7;
const plural = (n: number) => (n === 1 ? 'day' : 'days');

const status = (member: Member) => {
  const d = member.daysLeft;
  if (d < 0) {
    const late = Math.abs(d);
    return { text: `${late} ${plural(late)} late`, color: 'red' };
  }
  if (d === 0) return { text: 'Due today', color: 'yellow' };
  return { text: `${d} ${plural(d)} left`, color: 'green' };
};

export default function MemberList({ dueOnly }: { readonly dueOnly: boolean }) {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300);

  const q = debouncedQuery.trim().toLowerCase();
  const filtered = members.filter(
    (m) => (!dueOnly || !m.paymentDone) && m.name.toLowerCase().includes(q),
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
          const canRenew = m.daysLeft <= 0 && m.paymentDone;
          const dayLabel = m.daysLeft === 1 ? 'day' : 'days';

          const renewHint = !m.paymentDone
            ? 'Please complete your payment'
            : `Wait for ${m.daysLeft} ${dayLabel}`;

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
                    label="Payment already received"
                    disabled={!m.paymentDone}
                    events={{ hover: true, focus: true, touch: true }}
                  >
                    <div>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={m.paymentDone}
                        onClick={() => handlePay(m)}
                      >
                        Pay
                      </Button>
                    </div>
                  </Tooltip>

                  <Tooltip
                    label={renewHint}
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
                    <Text size="sm">{m.plan}</Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Expires:
                    </Text>
                    <Text size="sm">{m.expiry}</Text>
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
