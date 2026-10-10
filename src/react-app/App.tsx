import '@mantine/core/styles.css';
import { useCallback, useEffect, useState } from 'react';

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

import MemberList from './components/MemberList';
import Login from './components/Login';
import type { Member } from './types';

const theme = createTheme({
  fontSizes: {
    xs: '0.5rem',
    sm: '0.7rem',
    md: '0.8rem',
    lg: '0.9rem',
    xl: '1rem',
  },
});

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [dueOnly, setDueOnly] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Check whether the owner has a valid session.
  useEffect(() => {
    let active = true;

    fetch('/api/auth/me')
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

  const loadMembers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/members');

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
      setLoading(false);
    }
  }, []);

  // Load members only after authentication succeeds.
  useEffect(() => {
    if (authenticated !== true) return;

    void loadMembers();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadMembers();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authenticated, loadMembers]);

  // Determine what to display without nested ternaries.
  let content;

  if (authenticated === null) {
    content = <Text>Checking login...</Text>;
  } else if (authenticated === false) {
    content = <Login onLogin={() => setAuthenticated(true)} />;
  } else {
    content = (
      <>
        {dueOnly ? (
          <Group gap="sm">
            <Button>New Member</Button>
            <Button variant="outline" onClick={() => setDueOnly(false)}>
              Go Back
            </Button>
          </Group>
        ) : (
          <Group gap="sm">
            <Button>New Member</Button>
            <Button variant="outline" onClick={() => setDueOnly(true)}>
              Payments Due
            </Button>
          </Group>
        )}

        {loading && <Text>Loading...</Text>}

        {!loading && error && (
          <Stack align="center" gap="xs">
            <Text c="red">Could not load members. Please try again.</Text>
            <Button variant="subtle" onClick={() => void loadMembers()}>
              Retry
            </Button>
          </Stack>
        )}

        {!loading && !error && (
          <MemberList
            key={dueOnly ? 'due' : 'all'}
            dueOnly={dueOnly}
            members={members}
          />
        )}
      </>
    );
  }

  return (
    <MantineProvider theme={theme}>
      <Container size={400} px="md">
        <Stack align="center" gap="md" mih="100dvh" pt="xl">
          <Title order={1} ta="center" c="blue">
            Power Bull Gym
          </Title>

          <Text ta="center" w="100%" size="lg">
            Track your gym members for due payments.
          </Text>

          {content}
        </Stack>
      </Container>
    </MantineProvider>
  );
}

export default App;
