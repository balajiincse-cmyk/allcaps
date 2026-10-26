import { Box, Stack, Typography } from '@mui/material';

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
      spacing={2}
      sx={{ mb: 4 }}
    >
      <Box>
        <Typography variant="overline" color="primary" fontWeight={700}>
          {eyebrow}
        </Typography>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
          {description}
        </Typography>
      </Box>
      {actions}
    </Stack>
  );
}
