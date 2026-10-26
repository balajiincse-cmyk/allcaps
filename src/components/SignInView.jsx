import { useState } from 'react';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import AuthLayout from './AuthLayout.jsx';
import { signIn } from '../api/authApi.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInView({ onSignedIn, onProfileNotFound, onSwitchToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setSubmitting(true);
    try {
      onSignedIn(await signIn(trimmedEmail, password));
    } catch (requestError) {
      if (requestError.code === 'PROFILE_NOT_FOUND') {
        onProfileNotFound(trimmedEmail);
        return;
      }
      setError(requestError.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign in" description="Access the ALLCAPS console.">
      <Stack component="form" noValidate onSubmit={handleSubmit} spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          fullWidth
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          fullWidth
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={<LoginIcon />}
          sx={{ py: 1.25 }}
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          New here?{' '}
          <Link component="button" type="button" onClick={onSwitchToSignUp} sx={{ verticalAlign: 'baseline' }}>
            Create a profile
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
