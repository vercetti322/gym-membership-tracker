// src/App.tsx
import '@mantine/core/styles.css';
import { useState } from 'react';

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

const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  colors: {
    brand: [
      '#fff0ec',
      '#ffe0d8',
      '#ffc0b0',
      '#ff9d85',
      '#f97a5a',
      '#f2603d',
      '#ee4b2b',
      '#d43d1f',
      '#b83319',
      '#9c2a13',
    ],
  },
  fontSizes: {
    xs: '0.5rem',
    sm: '0.7rem',
    md: '0.8rem',
    lg: '0.9rem',
    xl: '1rem',
  },
});

function App() {
  const [dueOnly, setDueOnly] = useState(false);

  return (
    <MantineProvider theme={theme}>
      <Container size={400} px="md">
        <Stack align="center" justify="center" gap="md" mih="100dvh">
          <Title order={1} ta="center" c="brand.6">
            Power Bull Gym
          </Title>
          <Text ta="center" w="100%" size="lg">
            Track your gym members for due payments.
          </Text>
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
          <MemberList key={dueOnly ? 'due' : 'all'} dueOnly={dueOnly} />
        </Stack>
      </Container>
    </MantineProvider>
  );
}

export default App;
