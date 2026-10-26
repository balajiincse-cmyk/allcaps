import { Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PageHeader from './PageHeader.jsx';

const METRICS = [
  { label: 'Compilation velocity', value: '48', unit: 'scripts / min', delta: '+18% vs. last quarter' },
  { label: 'Data throughput', value: '1.9', unit: 'GB / day', delta: '+12% vs. last quarter' },
  { label: 'Load reduction', value: '62%', unit: 'vs. manual runs', delta: '+7 pts vs. last quarter' },
  { label: 'Batch success rate', value: '99.2%', unit: 'last 30 days', delta: '+0.6 pts vs. last quarter' },
];

const VELOCITY_WEEKS = [
  { label: 'W1', value: 22 },
  { label: 'W2', value: 28 },
  { label: 'W3', value: 31 },
  { label: 'W4', value: 36 },
  { label: 'W5', value: 40 },
  { label: 'W6', value: 44 },
  { label: 'W7', value: 47 },
  { label: 'W8', value: 52 },
];

const BENCHMARKS = [
  { label: 'XML catalog compile', before: '41 min', after: '9 min', reduction: 78 },
  { label: 'Dataset parse and merge', before: '26 min', after: '10 min', reduction: 62 },
  { label: 'Artboard slice export', before: '34 min', after: '10 min', reduction: 71 },
  { label: 'Packaging release', before: '18 min', after: '8 min', reduction: 56 },
];

const PLOT_HEIGHT = 180;
const MAX_VELOCITY = Math.max(...VELOCITY_WEEKS.map((week) => week.value));

function MetricCard({ label, value, unit, delta }) {
  return (
    <Card sx={{ flex: '1 1 220px', minWidth: 0 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ mt: 1 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {unit}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 2, color: 'success.main' }}>
          <TrendingUpIcon fontSize="small" />
          <Typography variant="caption" fontWeight={600} color="inherit">
            {delta}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function VelocityChart() {
  return (
    <Card sx={{ flex: { xs: '1 1 100%', lg: '1.6 1 0' }, minWidth: 0 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6">Server compilation velocity</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Scripts compiled per minute, weekly average
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, height: PLOT_HEIGHT + 24 }}>
          {VELOCITY_WEEKS.map(({ label, value }) => (
            <Stack key={label} sx={{ flex: 1, minWidth: 0, height: '100%', alignItems: 'center' }}>
              <Box sx={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <Box
                  title={`${value} scripts / min`}
                  sx={{
                    width: '100%',
                    height: (value / MAX_VELOCITY) * PLOT_HEIGHT,
                    bgcolor: 'primary.main',
                    borderRadius: '6px 6px 0 0',
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ height: 24, lineHeight: '24px' }}>
                {label}
              </Typography>
            </Stack>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function BenchmarkCard() {
  return (
    <Card sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0 }}>
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Typography variant="h6">Load reduction benchmarks</Typography>
          <Typography variant="body2" color="text.secondary">
            Runtime before and after automation
          </Typography>
        </Box>
        {BENCHMARKS.map(({ label, before, after, reduction }) => (
          <Box key={label}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }}>
              <Typography variant="body2" fontWeight={600}>
                {label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {before} → {after} · {reduction}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={reduction}
              sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(37, 99, 235, 0.12)' }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export default function StudiesView() {
  return (
    <>
      <PageHeader
        eyebrow="Analytics & Metrics"
        title="Automation Performance"
        description="Compilation velocity, data throughput, and load reduction across the InDesign, Photoshop, and Illustrator pipelines."
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {METRICS.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'stretch', gap: 3 }}>
        <VelocityChart />
        <BenchmarkCard />
      </Box>
    </>
  );
}
