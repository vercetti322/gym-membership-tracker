import { useState } from 'react';
import {
  Accordion,
  Anchor,
  Badge,
  Group,
  Pagination,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import type { Member } from '../types';
import { canRenew, plural, formatDate } from '../utils/MemberUtils';
import RenewButton from './UpdateButton';

const PAGE_SIZE = 7;

const status = (member: Member) => {
  const d = member.daysLeft;

  if (d === null) return { text: 'No plan', color: 'gray' as const };

  if (d < 0) {
    const late = Math.abs(d);
    return { text: `${late} ${plural(late)} late`, color: 'red' as const };
  }

  if (d === 0) return { text: 'Due today', color: 'red' as const };

  return { text: `${d} ${plural(d)} left`, color: 'green' as const };
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
    (m) => (!dueOnly || canRenew(m)) && m.name.toLowerCase().includes(q),
  );

  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);

  const visible = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const goTo = (p: number) => {
    setPage(p);
    setOpenId(null);
  };

  const onSearch = (value: string) => {
    setQuery(value);
    setPage(1);
    setOpenId(null);
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

          let planLabel = 'No plan';

          if (m.planMonths !== null) {
            const unit = m.planMonths === 1 ? 'month' : 'months';
            planLabel = `${m.planMonths} ${unit}`;
          }

          return (
            <Accordion.Item key={m.id} value={String(m.id)}>
              <Group wrap="nowrap" gap={0} pr="xs">
                <Accordion.Control style={{ flex: 1, minWidth: 0 }}>
                  <Group justify="space-between" wrap="nowrap" pr="xs" gap="xs">
                    <Text size="md" fw={400} lineClamp={1}>
                      {m.name}
                    </Text>

                    <Badge
                      color={s.color}
                      variant="light"
                      style={{ flexShrink: 0 }}
                    >
                      {s.text}
                    </Badge>
                  </Group>
                </Accordion.Control>

                <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <RenewButton member={m} />
                </Group>
              </Group>
              <Accordion.Panel>
                <Stack gap="lg" pt="sm">
                  {/* Contact and plan */}
                  <SimpleGrid cols={2} spacing="md">
                    <Stack gap={6} style={{ minWidth: 0 }}>
                      <Text size="sm" c="dimmed">
                        Phone number
                      </Text>

                      <Anchor
                        size="md"
                        fw={500}
                        href={`tel:${m.phone}`}
                        style={{ width: 'fit-content' }}
                      >
                        {m.phone}
                      </Anchor>
                    </Stack>

                    <Stack gap={6} style={{ minWidth: 0 }}>
                      <Text size="sm" c="dimmed">
                        Membership plan
                      </Text>

                      <Text size="md" fw={600}>
                        {planLabel}
                      </Text>
                    </Stack>
                  </SimpleGrid>

                  {/* Membership dates */}
                  <SimpleGrid cols={2} spacing="md">
                    <Stack gap={6} style={{ minWidth: 0 }}>
                      <Text size="sm" c="dimmed">
                        Starts
                      </Text>
                      <Text size="md" fw={600}>
                        {formatDate(m.paymentDate)}
                      </Text>
                    </Stack>

                    <Stack gap={6} style={{ minWidth: 0 }}>
                      <Text size="sm" c="dimmed">
                        Expires
                      </Text>
                      <Text size="md" fw={600}>
                        {formatDate(m.expiry)}
                      </Text>
                    </Stack>
                  </SimpleGrid>

                  {/* Payment method */}
                  <Group gap="sm" align="center" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      Payment method
                    </Text>

                    <Text size="md" fw={600}>
                      {m.paymentMode ?? '—'}
                    </Text>
                  </Group>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>

      <Group justify="center" mt="xs">
        <Pagination
          total={pages}
          value={currentPage}
          onChange={goTo}
          size="sm"
        />
      </Group>
    </Stack>
  );
}
