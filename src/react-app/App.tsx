// src/App.tsx
import '@mantine/core/styles.css';

import {
  Button,
  Container,
  Group,
  MantineProvider,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import MemberList from './components/MemberList';

const BRAND = '#ee4b2b';

function App() {
  return (
    <MantineProvider>
      <Container size={350} px="md">
        <Stack align="center" justify="center" gap="md" mih="100dvh">
          <Title order={1} c={BRAND} ta="center">
            Power Bull Gym
          </Title>
          <Text ta="center" w="100%" size="lg">
            Track your gym membership payments.
          </Text>
          <Group gap="sm">
            <Button color={BRAND}>New Member</Button>
            <Button color={BRAND}>Payments Due</Button>
          </Group>
          <MemberList />
        </Stack>
      </Container>
    </MantineProvider>
  );
}

export default App;
