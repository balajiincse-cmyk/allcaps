import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PageHeader from './PageHeader.jsx';

const ENGINES = ['InDesign Server', 'Illustrator Scripting', 'Photoshop Core API'];
const RUNTIMES = ['ExtendScript', 'UXP', 'Action listener'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = {
  name: '',
  email: '',
  engine: '',
  operatingSystem: '',
  engineVersion: '',
  runtime: '',
  message: '',
};
const FIELD_SX = { flex: '1 1 240px', minWidth: 0 };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Enter a valid email address.';
  if (!values.engine) errors.engine = 'Select a target Adobe engine.';
  if (!values.operatingSystem.trim()) errors.operatingSystem = 'Operating system is required.';
  if (!values.engineVersion.trim()) errors.engineVersion = 'Engine version is required.';
  if (!values.runtime) errors.runtime = 'Select a script runtime.';
  if (values.message.trim().length < 20) errors.message = 'Message must be at least 20 characters.';
  return errors;
}

export default function ContactView() {
  const [values, setValues] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);
  const isInvalid = Object.keys(errors).length > 0;

  const visibleError = (name) => (submitAttempted || touched[name] ? errors[name] : undefined);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setSubmitted(false);
  };

  const markTouched = (name) => setTouched((prev) => ({ ...prev, [name]: true }));

  const fieldProps = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: () => markTouched(name),
    error: Boolean(visibleError(name)),
    helperText: visibleError(name) ?? ' ',
    sx: FIELD_SX,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (isInvalid) return;
    setSubmitted(true);
    setValues(EMPTY_FORM);
    setTouched({});
    setSubmitAttempted(false);
  };

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <PageHeader
        eyebrow="Contact"
        title="Technical Feedback"
        description="Describe your environment and the issue or request. Include the target engine so the report reaches the right automation track."
      />

      <Card component="form" noValidate onSubmit={handleSubmit}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            {submitted && (
              <Alert severity="success" onClose={() => setSubmitted(false)}>
                Feedback captured. Thank you for the environment details.
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
              <TextField label="Full name" required {...fieldProps('name')} />
              <TextField label="Email" type="email" required {...fieldProps('email')} />
            </Box>

            <Typography variant="h6">Environment specification</Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
              <TextField select label="Target Adobe engine" required {...fieldProps('engine')}>
                {ENGINES.map((engine) => (
                  <MenuItem key={engine} value={engine}>
                    {engine}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Script runtime" required {...fieldProps('runtime')}>
                {RUNTIMES.map((runtime) => (
                  <MenuItem key={runtime} value={runtime}>
                    {runtime}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Operating system" required {...fieldProps('operatingSystem')} />
              <TextField label="Engine version" required {...fieldProps('engineVersion')} />
            </Box>

            <TextField
              label="Message"
              required
              multiline
              minRows={5}
              fullWidth
              {...fieldProps('message')}
            />

            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" variant="contained" endIcon={<SendIcon />} sx={{ px: 3, py: 1.25 }}>
                Submit feedback
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
