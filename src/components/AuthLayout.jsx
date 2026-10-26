import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function AuthLayout({ title, description, maxWidth = 440, children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ width: '100%', maxWidth }}>
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: '#FFFFFF',
            }}
          >
            <AutoAwesomeIcon />
          </Box>
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            {description}
          </Typography>
        </Stack>
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>{children}</CardContent>
        </Card>
      </Box>
    </Box>
  );
}
