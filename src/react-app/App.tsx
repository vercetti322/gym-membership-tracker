import '@mantine/core/styles.css';
import { useCallback, useEffect, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';
import NewMember from './components/NewMember';
import {
  Button,
  Container,
  Group,
  MantineProvider,
  createTheme,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { ButtonProps, MantineTheme } from '@mantine/core';

import MemberList from './components/MemberList';
import Login from './components/Login';
import type { Member } from './types';

function ReloadButton({
  onRefresh,
}: {
  readonly onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      w={40}
      h={36}
      p={0}
      aria-label="Refresh members"
      loading={loading}
      onClick={handleRefresh}
    >
      {!loading && <IconRefresh size={18} />}
    </Button>
  );
}

const theme = createTheme({
  fontSizes: {
    xs: '0.69rem',
    sm: '0.92rem',
    md: '1.04rem',
    lg: '1.16rem',
    xl: '1.27rem',
  },
  components: {
    Button: {
      vars: (_theme: MantineTheme, { size }: ButtonProps) => ({
        root: {
          '--button-padding-x': `calc(var(--button-padding-x-${size ?? 'sm'}) * 0.8)`,
        },
      }),
    },
  },
});

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [dueOnly, setDueOnly] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Check authentication first whenever the application loads.
  useEffect(() => {
    let active = true;

    fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => {
        if (active) {
          setAuthenticated(response.ok);
        }
      })
      .catch(() => {
        if (active) {
          setAuthenticated(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch the latest members without reloading the page.
  const loadMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/members', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load members');
      }

      const data: Member[] = await response.json();

      setMembers(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Fetch members only after authentication succeeds.
  useEffect(() => {
    if (authenticated !== true) return;

    void loadMembers();
  }, [authenticated, loadMembers]);

  let content;

  if (authenticated === null) {
    content = <Text>Checking login...</Text>;
  } else if (authenticated === false) {
    content = <Login onLogin={() => setAuthenticated(true)} />;
  } else {
    content = (
      <>
        <Group gap="sm">
          <NewMember onCreated={loadMembers} />

          {dueOnly ? (
            <Button variant="outline" onClick={() => setDueOnly(false)}>
              Go Back
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setDueOnly(true)}>
              Payments Due
            </Button>
          )}

          <ReloadButton onRefresh={loadMembers} />
        </Group>

        {!loaded && !error && <Text>Loading...</Text>}

        {error && (
          <Text c="red">
            Could not load members. Click refresh to try again.
          </Text>
        )}

        {loaded && !error && (
          <MemberList
            key={dueOnly ? 'due' : 'all'}
            dueOnly={dueOnly}
            members={members}
            onMemberUpdated={loadMembers}
          />
        )}
      </>
    );
  }

  return (
    <MantineProvider theme={theme}>
      <Container size={365} px="md">
        <Stack align="center" gap="md" mih="100dvh" pt="xl">
          <Title order={1} ta="center" c="blue">
            Power Bull Gym
          </Title>

          <Text ta="center" w="100%" size="lg">
            Manage your memberships and get payment reminders.
          </Text>

          {content}
        </Stack>
      </Container>
    </MantineProvider>
  );
}

export default App;
