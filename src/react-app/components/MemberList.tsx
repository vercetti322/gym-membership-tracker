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
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';

type Member = {
  id: number;
  name: string;
  phone: string;
  plan: string;
  expiry: string;
};

const base: Member[] = [
  {
    id: 1,
    name: 'Rahul Sharma',
    phone: '9876543210',
    plan: '3 months',
    expiry: '2026-10-20',
  },
  {
    id: 2,
    name: 'Anil Kumar',
    phone: '9812345678',
    plan: '1 month',
    expiry: '2026-11-02',
  },
  {
    id: 3,
    name: 'Priya Singh',
    phone: '9988776655',
    plan: '12 months',
    expiry: '2026-10-09',
  },
];

const members: Member[] = Array.from({ length: 10 }, (_, i) => ({
  ...base[i % 3],
  id: i + 1,
}));

const PAGE_SIZE = 5;

// ---------- days left ----------
const daysLeft = (expiry: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${expiry}T00:00:00`);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
};

const status = (expiry: string) => {
  const d = daysLeft(expiry);
  if (d < 0) return { text: 'Expired', color: 'red' };
  if (d === 0) return { text: 'Due today', color: 'yellow' };
  if (d <= 7)
    return { text: `${d} day${d === 1 ? '' : 's'} left`, color: 'yellow' };
  return { text: `${d} days left`, color: 'green' };
};

export default function MemberList() {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300);

  const q = debouncedQuery.trim().toLowerCase();
  const filtered = members.filter((m) => m.name.toLowerCase().includes(q));

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

  return (
    <Stack w="100%" gap="sm" mih={560}>
      <TextInput
        placeholder="Search by name"
        value={query}
        onChange={(e) => onSearch(e.currentTarget.value)}
      />

      {visible.length === 0 && (
        <Text ta="center" c="dimmed">
          No members found
        </Text>
      )}

      <Accordion
        variant="separated"
        radius="md"
        value={openId}
        onChange={setOpenId}
      >
        {visible.map((m) => {
          const s = status(m.expiry);
          return (
            <Accordion.Item key={m.id} value={String(m.id)}>
              <Group wrap="nowrap" gap={0} pr="xs">
                <Accordion.Control style={{ flex: 1 }}>
                  <Group justify="space-between" wrap="nowrap" pr="xs">
                    <Text fw={500}>{m.name}</Text>
                    <Badge color={s.color} variant="light">
                      {s.text}
                    </Badge>
                  </Group>
                </Accordion.Control>

                <Button
                  size="xs"
                  style={{ flexShrink: 0 }}
                  onClick={() => handleRenew(m)}
                >
                  Renew
                </Button>
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
