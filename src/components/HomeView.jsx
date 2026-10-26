import { Box, Card, CardContent, Chip, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import BrushIcon from '@mui/icons-material/Brush';
import TerminalIcon from '@mui/icons-material/Terminal';
import PageHeader from './PageHeader.jsx';

const XML_WORKFLOWS = {
  icon: CodeIcon,
  title: 'InDesign XML Workflows',
  description: 'Structured XML pipelines that bind schema parameters to InDesign elements and generate catalog pages from database records.',
  items: [
    'Structural schema mapping parameters for template-driven composition',
    'Tag-to-element metadata matrix bindings for consistent style resolution',
    'Catalog page rules applied across master spreads and sections',
    'Database structural mapping for record-to-frame placement',
  ],
  tags: ['XML Import', 'Tag Mapping', 'Catalog Rules', 'DB Mapping'],
};

const NON_XML_WORKFLOWS = {
  icon: StorageIcon,
  title: 'InDesign Non-XML Workflows',
  description: 'Lightweight automation modules that parse flat datasets and distribute runtime text across document frames.',
  items: [
    'JSON and CSV dataset parsing with field validation',
    'Modern ExtendScript modules built from reusable routines',
    'Dynamic runtime text distribution arrays for multi-frame flow',
    'Batch document export after each merge cycle',
  ],
  tags: ['JSON', 'CSV', 'ExtendScript', 'Text Flow'],
};

const IMAGE_ENGINES = {
  icon: BrushIcon,
  title: 'Photoshop & Illustrator Engines',
  description: 'Variable-driven canvas adjustments and asset production for Photoshop and Illustrator documents.',
  items: [
    'Variable-driven dynamic canvas adjustments per record',
    'Automatic artboard asset slicing and export',
    'Packaging production scripts for repeatable release builds',
    'Script listener action handlers for event-driven execution',
  ],
  tags: ['Photoshop Core API', 'Illustrator Scripting', 'Actions', 'Slices'],
};

const RUNTIME_TARGETS = {
  icon: TerminalIcon,
  title: 'Adobe Runtime Targets',
  description: 'Engines the automation layer dispatches jobs to, each with its own scripting surface.',
  items: [
    'InDesign Server for XML and data-merge jobs',
    'Illustrator Scripting for artboard and export tasks',
    'Photoshop Core API for canvas and layer automation',
  ],
  tags: ['InDesign Server', 'Illustrator', 'Photoshop'],
};

function WorkflowCard({ icon: Icon, title, description, items, tags }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(37, 99, 235, 0.1)',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Icon />
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>

        <List dense disablePadding>
          {items.map((item) => (
            <ListItem key={item} disableGutters alignItems="flex-start">
              <ListItemIcon sx={{ minWidth: 32, mt: 0.25, color: 'success.main' }}>
                <CheckCircleOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} slotProps={{ primary: { variant: 'body2' } }} />
            </ListItem>
          ))}
        </List>

        <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} sx={{ mt: 'auto', pt: 1 }}>
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function HomeView() {
  return (
    <>
      <PageHeader
        eyebrow="Home Dashboard"
        title="Automation Workflows"
        description="Production scripting modules for InDesign, Photoshop, and Illustrator, grouped by runtime."
      />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'stretch', gap: 3 }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <WorkflowCard {...XML_WORKFLOWS} />
          <WorkflowCard {...NON_XML_WORKFLOWS} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <WorkflowCard {...IMAGE_ENGINES} />
          <WorkflowCard {...RUNTIME_TARGETS} />
        </Box>
      </Box>
    </>
  );
}
