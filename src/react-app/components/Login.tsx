import { useState } from 'react';
import { Button, PasswordInput, Stack, Text, Title } from '@mantine/core';

export default function Login({ onLogin }: { readonly onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Incorrect password.');
        return;
      }

      onLogin();
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack align="stretch" maw={320} w="100%">
      <Title order={2} ta="center" c="blue">
        Power Bull Gym
      </Title>
      <Text ta="center">Enter your password to continue.</Text>

      <PasswordInput
        label="Password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void handleLogin();
        }}
      />

      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}

      <Button onClick={handleLogin} loading={loading}>
        Login
      </Button>
    </Stack>
  );
}
