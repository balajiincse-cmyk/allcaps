import { useState } from 'react';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import AuthLayout from './AuthLayout.jsx';
import { signUp } from '../api/authApi.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_SX = { flex: '1 1 240px', minWidth: 0 };

const buildEmptyForm = (email) => ({
  firstName: '',
  lastName: '',
  callingName: '',
  email,
  password: '',
  confirmPassword: '',
  phone: '',
  organization: '',
  jobTitle: '',
  city: '',
  country: '',
  bio: '',
});

function validate(values) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = 'First name is required.';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.';
  if (!values.phone.trim()) errors.phone = 'Phone is required.';
  if (!values.organization.trim()) errors.organization = 'Organization is required.';
  if (!values.jobTitle.trim()) errors.jobTitle = 'Job title is required.';
  if (!values.city.trim()) errors.city = 'City is required.';
  if (!values.country.trim()) errors.country = 'Country is required.';
  return errors;
}

export default function SignUpView({ initialEmail = '', notice, onSignedUp, onSwitchToSignIn }) {
  const [values, setValues] = useState(() => buildEmptyForm(initialEmail));
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const errors = validate(values);
  const visibleError = (name) => (submitAttempted ? errors[name] : undefined);

  const fieldProps = (name) => ({
    name,
    value: values[name],
    onChange: (event) => setValues((prev) => ({ ...prev, [name]: event.target.value })),
    error: Boolean(visibleError(name)),
    helperText: visibleError(name) ?? ' ',
    sx: FIELD_SX,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      onSignedUp(await signUp(values));
    } catch (requestError) {
      setServerError(requestError.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your profile"
      description="Enter your basic details to get started."
      maxWidth={720}
    >
      <Stack component="form" noValidate onSubmit={handleSubmit} spacing={2.5}>
        {notice && <Alert severity="info">{notice}</Alert>}
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
          <TextField label="First name" autoComplete="given-name" required {...fieldProps('firstName')} />
          <TextField label="Last name" autoComplete="family-name" required {...fieldProps('lastName')} />
          <TextField label="Calling name" autoComplete="nickname" {...fieldProps('callingName')} />
          <TextField label="Email" type="email" autoComplete="email" required {...fieldProps('email')} />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            {...fieldProps('password')}
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            {...fieldProps('confirmPassword')}
          />
          <TextField label="Phone" autoComplete="tel" required {...fieldProps('phone')} />
          <TextField label="Organization" autoComplete="organization" required {...fieldProps('organization')} />
          <TextField label="Job title" required {...fieldProps('jobTitle')} />
          <TextField label="City" autoComplete="address-level2" required {...fieldProps('city')} />
          <TextField label="Country" autoComplete="country-name" required {...fieldProps('country')} />
          <TextField
            label="Bio"
            multiline
            minRows={3}
            placeholder="A few lines about yourself"
            {...fieldProps('bio')}
            sx={{ flex: '1 1 100%' }}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={<PersonAddAltIcon />}
          sx={{ py: 1.25 }}
        >
          {submitting ? 'Creating profile...' : 'Create profile'}
        </Button>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Already have a profile?{' '}
          <Link component="button" type="button" onClick={onSwitchToSignIn} sx={{ verticalAlign: 'baseline' }}>
            Sign in
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
