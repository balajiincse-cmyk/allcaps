import { useEffect, useState } from 'react';
import { Box, Chip, List, ListItemButton, ListItemText, Stack, Typography } from '@mui/material';
import PageHeader from './PageHeader.jsx';

const STATUS_COLOR = {
  Complete: 'success',
  'In progress': 'warning',
  Planned: 'default',
};

const MILESTONES = [
  {
    id: 'discovery',
    title: 'Discovery and schema mapping',
    status: 'Complete',
    paragraphs: [
      'Every source dataset is catalogued and mapped to InDesign structural parameters before any template is modified.',
    ],
    bullets: [
      'Inventory XML, JSON, and CSV sources with field-level types',
      'Define structural schema parameters per template family',
      'Document database-to-frame mapping rules',
    ],
  },
  {
    id: 'xml-binding',
    title: 'XML template binding',
    status: 'Complete',
    paragraphs: [
      'Tag-to-element metadata is held in a single matrix so each template resolves styles and frames from the same source of truth.',
    ],
    code: `{
  "template": "catalog-spread-A",
  "tagMap": {
    "product/name": "ParagraphStyle:ProductTitle",
    "product/price": "ParagraphStyle:Price",
    "product/image": "Frame:ImageSlot"
  },
  "catalogPageRule": { "recordsPerPage": 6, "overflow": "newPage" }
}`,
    bullets: [
      'Bind XML tags to paragraph, character, and object styles',
      'Apply catalog page rules during record placement',
    ],
  },
  {
    id: 'data-distribution',
    title: 'Non-XML data distribution',
    status: 'In progress',
    paragraphs: [
      'Flat datasets are normalised into ordered record arrays and distributed across frames at runtime.',
    ],
    bullets: [
      'Parse JSON and CSV datasets into normalised record arrays',
      'Distribute runtime text across frames using ordered arrays',
      'Emit a merge log for every batch',
    ],
  },
  {
    id: 'engine-scripts',
    title: 'Photoshop and Illustrator engine scripts',
    status: 'In progress',
    paragraphs: [
      'Canvas adjustments and asset slices are driven by the same record variables used by the layout pipeline.',
    ],
    bullets: [
      'Variable-driven canvas adjustments per record',
      'Automatic artboard slicing with naming conventions',
      'Script listener action handlers for event triggers',
    ],
  },
  {
    id: 'release',
    title: 'Packaging and release',
    status: 'Planned',
    paragraphs: [
      'Production scripts are bundled with version manifests and verified against reference datasets before distribution.',
    ],
    bullets: [
      'Bundle production scripts with version manifests',
      'Run regression batches against reference datasets',
      'Publish signed script packages for distribution',
    ],
  },
];

function TableOfContents({ items, activeId, onSelect }) {
  return (
    <Box sx={{ borderLeft: 1, borderColor: 'divider' }}>
      <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ pl: 2 }}>
        On this page
      </Typography>
      <List dense disablePadding sx={{ mt: 1 }}>
        {items.map((item, index) => {
          const selected = item.id === activeId;
          return (
            <ListItemButton
              key={item.id}
              component="a"
              href={`#${item.id}`}
              selected={selected}
              onClick={(event) => {
                event.preventDefault();
                onSelect(item.id);
              }}
              sx={{
                pl: 2,
                py: 0.75,
                borderLeft: 2,
                borderColor: selected ? 'primary.main' : 'transparent',
                color: selected ? 'primary.main' : 'text.secondary',
                borderRadius: 0,
                '&.Mui-selected': { bgcolor: 'transparent' },
                '&.Mui-selected:hover': { bgcolor: 'rgba(37, 99, 235, 0.06)' },
              }}
            >
              <ListItemText
                primary={`${String(index + 1).padStart(2, '0')}  ${item.title}`}
                slotProps={{ primary: { variant: 'body2', fontWeight: selected ? 600 : 400 } }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export default function ProjectsView() {
  const [activeId, setActiveId] = useState(MILESTONES[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-120px 0px -60% 0px' }
    );

    MILESTONES.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleSelect = (id) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        eyebrow="Technical Documentation"
        title="Project Implementation Guide"
        description="Milestones for the InDesign, Photoshop, and Illustrator automation stack, from schema discovery to packaged release."
      />

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <Box component="article" sx={{ flex: 1, minWidth: 0, maxWidth: 760 }}>
          {MILESTONES.map((milestone, index) => (
            <Box
              key={milestone.id}
              component="section"
              id={milestone.id}
              sx={{ scrollMarginTop: 96, pb: 6, mb: 6, borderBottom: index < MILESTONES.length - 1 ? 1 : 0, borderColor: 'divider' }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="overline" color="primary" fontWeight={700}>
                  Milestone {String(index + 1).padStart(2, '0')}
                </Typography>
                <Chip size="small" label={milestone.status} color={STATUS_COLOR[milestone.status]} variant="outlined" />
              </Stack>

              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                {milestone.title}
              </Typography>

              <Stack spacing={2}>
                {milestone.paragraphs.map((text) => (
                  <Typography key={text} color="text.secondary" lineHeight={1.7}>
                    {text}
                  </Typography>
                ))}

                {milestone.code && (
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: '#0F172A',
                      color: '#E2E8F0',
                      fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                      fontSize: 13,
                      lineHeight: 1.6,
                      overflowX: 'auto',
                    }}
                  >
                    {milestone.code}
                  </Box>
                )}

                <List dense disablePadding sx={{ listStyleType: 'disc', pl: 3 }}>
                  {milestone.bullets.map((bullet) => (
                    <Box key={bullet} component="li" sx={{ color: 'text.secondary', typography: 'body2', mb: 0.5 }}>
                      {bullet}
                    </Box>
                  ))}
                </List>
              </Stack>
            </Box>
          ))}
        </Box>

        <Box
          component="aside"
          sx={{
            display: { xs: 'none', lg: 'block' },
            width: 260,
            flexShrink: 0,
            position: 'sticky',
            top: 32,
            alignSelf: 'flex-start',
          }}
        >
          <TableOfContents items={MILESTONES} activeId={activeId} onSelect={handleSelect} />
        </Box>
      </Box>
    </Box>
  );
}
