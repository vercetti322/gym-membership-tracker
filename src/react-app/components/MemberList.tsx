import { useCallback, useEffect, useRef, useState } from 'react';
import { processMemberPhoto } from '../utils/AvatarUtils';
import {
  Accordion,
  Anchor,
  Avatar,
  ActionIcon,
  Group,
  Badge,
  Pagination,
  Box,
  SimpleGrid,
  Stack,
  Modal,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import type { Member } from '../types';
import { canRenew, plural, formatDate } from '../utils/MemberUtils';
import RenewButton from './UpdatePlan';

const PAGE_SIZE = 5;

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

async function fetchMemberPhoto(id: number): Promise<string | null> {
  try {
    const response = await fetch(`/api/members/${id}/photo`, {
      credentials: 'include',
    });

    if (!response.ok) return null;

    return URL.createObjectURL(await response.blob());
  } catch {
    return null;
  }
}

async function loadMemberPhotos(
  members: Member[],
  onPhotoLoaded: (id: number, url: string) => void,
  isCancelled: () => boolean,
): Promise<void> {
  if (isCancelled() || members.length === 0) return;

  const [member, ...remaining] = members;
  const url = await fetchMemberPhoto(member.id);

  if (isCancelled()) {
    if (url) URL.revokeObjectURL(url);
    return;
  }

  if (url) onPhotoLoaded(member.id, url);

  await loadMemberPhotos(remaining, onPhotoLoaded, isCancelled);
}

export default function MemberList({
  dueOnly,
  members,
  onMemberUpdated,
}: {
  readonly dueOnly: boolean;
  readonly members: Member[];
  readonly onMemberUpdated: () => Promise<void>;
}) {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<Record<number, string>>(
    {},
  );
  const [photoModalMemberId, setPhotoModalMemberId] = useState<number | null>(
    null,
  );

  const q = debouncedQuery.trim().toLowerCase();

  const filtered = members.filter(
    (m) => (!dueOnly || canRenew(m)) && m.name.toLowerCase().includes(q),
  );

  // Display members in ascending ID order.
  const sorted = [...filtered].sort((a, b) => a.id - b.id);

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

  const saveMemberPhoto = async (memberId: number, photo: Blob) => {
    const response = await fetch(`/api/members/${memberId}/photo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: photo,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? 'Failed to save photo');
    }
  };

  const photoUrlsRef = useRef<Record<number, string>>({});
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePhotoPreview = useCallback((id: number, url: string) => {
    const oldUrl = photoUrlsRef.current[id];

    if (oldUrl && oldUrl !== url) URL.revokeObjectURL(oldUrl);

    photoUrlsRef.current[id] = url;

    setPhotoPreviews((previous) => ({
      ...previous,
      [id]: url,
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const membersWithPhotos = members
      .filter((member) => member.hasPhoto)
      .sort((a, b) => a.id - b.id);

    void loadMemberPhotos(
      membersWithPhotos,
      updatePhotoPreview,
      () => cancelled,
    );

    return () => {
      cancelled = true;
    };
  }, [members, updatePhotoPreview]);

  useEffect(() => {
    if (cleanupTimerRef.current !== null) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    return () => {
      cleanupTimerRef.current = setTimeout(() => {
        Object.values(photoUrlsRef.current).forEach((url) => {
          URL.revokeObjectURL(url);
        });

        photoUrlsRef.current = {};
        cleanupTimerRef.current = null;
      }, 0);
    };
  }, []);

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

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];

          const memberId = selectedMemberId;
          input.value = '';

          if (!file || memberId === null) return;

          try {
            const processedPhoto = await processMemberPhoto(file);

            const previewUrl = URL.createObjectURL(processedPhoto);
            updatePhotoPreview(memberId, previewUrl);

            // Save after updating the preview so the UI responds immediately.
            void saveMemberPhoto(memberId, processedPhoto)
              .then(() => onMemberUpdated())
              .catch((error: unknown) => {
                console.error('Photo save failed:', error);
                alert(
                  'Photo could not be saved. It may not persist after refresh.',
                );
              });
          } catch (error) {
            alert(
              error instanceof Error
                ? error.message
                : 'Unable to process or save the photo.',
            );
          }
        }}
      />

      <Modal
        opened={photoModalMemberId !== null}
        onClose={() => setPhotoModalMemberId(null)}
        withOverlay
        withCloseButton={false}
        padding={0}
        size="auto"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          color: '#000',
          blur: 3,
        }}
        styles={{
          content: {
            background: 'transparent',
            boxShadow: 'none',
            overflow: 'visible',
          },
          body: {
            padding: 0,
          },
          header: {
            display: 'none',
          },
        }}
      >
        {photoModalMemberId !== null && photoPreviews[photoModalMemberId] && (
          <Stack gap="md" align="center">
            <Box
              style={{
                width: 300,
                height: 300,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src={photoPreviews[photoModalMemberId]}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </Box>

            <button
              type="button"
              onClick={() => {
                setSelectedMemberId(photoModalMemberId);
                photoInputRef.current?.click();
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: 0,
                borderRadius: 8,
                background: 'var(--mantine-color-blue-6)',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Change Photo
            </button>
          </Stack>
        )}
      </Modal>

      <Accordion
        variant="separated"
        radius="md"
        value={openId}
        onChange={setOpenId}
        styles={{
          item: {
            border: '1px solid var(--mantine-color-gray-3)',
            backgroundColor: 'transparent',
          },
          control: {
            backgroundColor: 'transparent',
          },
          panel: {
            backgroundColor: 'transparent',
          },
        }}
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
              <Group wrap="nowrap" gap={0} px="sm">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  size={64}
                  aria-label={`Add or change ${m.name}'s profile photo`}
                  onClick={(event) => {
                    event.stopPropagation();

                    if (photoPreviews[m.id]) {
                      setPhotoModalMemberId(m.id);
                    } else {
                      setSelectedMemberId(m.id);
                      photoInputRef.current?.click();
                    }
                  }}
                  styles={{
                    root: {
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    },
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <Avatar
                    src={photoPreviews[m.id] ?? null}
                    alt={`${m.name}'s profile photo`}
                    size={50}
                    radius="50%"
                    color="gray"
                    variant="light"
                    styles={{ placeholder: { fontSize: 24, fontWeight: 400 } }}
                  >
                    {!photoPreviews[m.id] && '+'}
                  </Avatar>
                </ActionIcon>
                <Accordion.Control
                  style={{ flex: 1, minWidth: 0 }}
                  pl={4}
                  pr="md"
                  py={6}
                >
                  <Stack gap={4} align="flex-start">
                    <Text size="md" fw={600} lineClamp={2}>
                      {m.name}
                    </Text>

                    <Badge
                      color={s.color}
                      variant="light"
                      size="sm"
                      radius="sm"
                      px={4}
                      styles={{ root: { alignSelf: 'flex-start' } }}
                    >
                      {s.text}
                    </Badge>
                  </Stack>
                </Accordion.Control>
                <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <RenewButton member={m} onUpdated={onMemberUpdated} />
                </Group>
              </Group>

              <Accordion.Panel>
                <Stack gap="lg" pt="sm">
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
