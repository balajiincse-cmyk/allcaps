import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, List, ListItemButton, ListItemText, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PageHeader from './PageHeader.jsx';
import { createProject, deleteProject, fetchProjects, getStoredToken, updateProject } from '../api/authApi.js';

const EMPTY_FORM = { title: '', description: '', features: '', images: [] };
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const IMAGE_SX = { width: '100%', height: 220, objectFit: 'contain', bgcolor: '#E2E8F0', borderRadius: 2 };

function TableOfContents({ items, activeId, onSelect }) {
  return (
    <Box sx={{ borderLeft: 1, borderColor: 'divider' }}>
      <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ pl: 2 }}>
        On this page
      </Typography>
      <List dense disablePadding sx={{ mt: 1 }}>
        {items.map((item, index) => (
          <ListItemButton
            key={item._id}
            component="a"
            href={`#project-${item._id}`}
            selected={item._id === activeId}
            onClick={(event) => {
              event.preventDefault();
              onSelect(item._id);
            }}
            sx={{
              pl: 2, py: 0.75, borderLeft: 2, borderRadius: 0,
              borderColor: item._id === activeId ? 'primary.main' : 'transparent',
            }}
          >
            <ListItemText primary={`${String(index + 1).padStart(2, '0')}  ${item.title}`} />
          </ListItemButton>
        ))}
        {!items.length && (
          <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>No projects yet.</Typography>
        )}
      </List>
    </Box>
  );
}

export default function ProjectsView({ user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [readingImages, setReadingImages] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const isAdmin = user?.role === 'admin';

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const { projects: result } = await fetchProjects(getStoredToken());
      setProjects(result);
      setActiveId(result[0]?._id ?? '');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) setActiveId(visible.target.id.replace('project-', ''));
    }, { rootMargin: '-120px 0px -60% 0px' });
    projects.forEach(({ _id }) => {
      const element = document.getElementById(`project-${_id}`);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [projects]);

  const handleImages = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    setFormError('');
    if (form.images.length + files.length > 4 ||
      files.some((file) => !IMAGE_TYPES.includes(file.type) || file.size > 1024 * 1024)) {
      setFormError('Choose up to 4 PNG, JPG, GIF, or WebP images, at most 1 MB each.');
      return;
    }
    setReadingImages(true);
    try {
      const images = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(`Could not read ${file.name}. Please try another image.`));
        reader.readAsDataURL(file);
      })));
      setForm((current) => ({ ...current, images: [...current.images, ...images] }));
    } catch (readError) {
      setFormError(readError.message);
    } finally {
      setReadingImages(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError('');
    const features = form.features.split(/\r?\n/).map((text) => text.trim()).filter(Boolean);
    if (!form.title.trim() || form.title.trim().length > 200 ||
      !form.description.trim() || form.description.trim().length > 10000 ||
      !features.length || features.length > 50 || features.some((feature) => feature.length > 500)) {
      setFormError('Enter a title (up to 200 characters), description (up to 10,000), and 1 to 50 features (up to 500 characters each).');
      return;
    }
    setSaving(true);
    try {
      const { project } = editingId
        ? await updateProject(getStoredToken(), editingId, { ...form, features })
        : await createProject(getStoredToken(), { ...form, features });
      setProjects((current) => editingId
        ? current.map((item) => item._id === editingId ? project : item)
        : [...current, project]);
      setActiveId(project._id);
      setOpen(false);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await deleteProject(getStoredToken(), deleting._id);
      const remaining = projects.filter((project) => project._id !== deleting._id);
      setProjects(remaining);
      if (activeId === deleting._id) setActiveId(remaining[0]?._id ?? '');
      setDeleting(null);
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description="Explore our projects and their features."
        actions={isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
            setEditingId(null); setForm(EMPTY_FORM); setFormError(''); setOpen(true);
          }}>Add project</Button>
        )}
      />
      {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button onClick={loadProjects}>Retry</Button>}>{error}</Alert>}
      {loading ? <CircularProgress aria-label="Loading projects" /> : (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', lg: 'row' }, alignItems: 'flex-start', gap: 4 }}>
          <Box component="article" sx={{ flex: 1, minWidth: 0, width: '100%' }}>
            {!projects.length && !error && (
              <Alert severity="info">
                {isAdmin ? 'No projects yet. Add your first project to get started.' : 'No projects have been added yet.'}
              </Alert>
            )}
            {projects.map((project) => (
              <Card component="section" id={`project-${project._id}`} key={project._id} sx={{ mb: 3, scrollMarginTop: 96 }}>
                <CardContent sx={{ p: 3, overflowWrap: 'anywhere' }}>
                  <Typography variant="h5" component="h2" sx={{ mb: 2 }}>{project.title}</Typography>
                  {isAdmin && (
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Button startIcon={<EditOutlinedIcon />} onClick={() => {
                        setEditingId(project._id);
                        setForm({
                          title: project.title, description: project.description,
                          features: project.features.join('\n'), images: [...project.images],
                        });
                        setFormError('');
                        setOpen(true);
                      }}>Edit</Button>
                      <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => {
                        setDeleteError(''); setDeleting(project);
                      }}>Delete</Button>
                    </Stack>
                  )}
                  <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{project.description}</Typography>
                  <Typography variant="h6" component="h3" sx={{ mt: 3 }}>Features</Typography>
                  <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
                    {project.features.map((feature, index) => <Box component="li" key={index} sx={{ mb: 1 }}>{feature}</Box>)}
                  </Box>
                  {project.images.length > 0 && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2, mt: 3 }}>
                      {project.images.map((image, index) => (
                        <Box component="img" key={index} src={image} alt={`${project.title}, image ${index + 1}`} loading="lazy" sx={IMAGE_SX} />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
          <Box component="aside" sx={{ width: { xs: '100%', lg: 260 }, flexShrink: 0, position: { lg: 'sticky' }, top: 32 }}>
            <TableOfContents items={projects} activeId={activeId} onSelect={(id) => {
              setActiveId(id);
              document.getElementById(`project-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }} />
          </Box>
        </Box>
      )}
      <Dialog open={open && isAdmin} onClose={() => { if (!saving && !readingImages) setOpen(false); }} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{editingId ? 'Edit project' : 'Add project'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField label="Project title" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <TextField label="Project description" required multiline minRows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <TextField label="Features" required multiline minRows={3} helperText="Enter one feature per line. Each feature will appear as a bullet." value={form.features} onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))} />
              <Button component="label" variant="outlined" disabled={saving || readingImages || form.images.length >= 4}>
                {readingImages ? 'Reading images...' : 'Upload images (optional)'}
                <input hidden type="file" multiple accept={IMAGE_TYPES.join(',')} onChange={handleImages} disabled={saving || readingImages} />
              </Button>
              <Typography variant="caption" color="text.secondary">Up to 4 images, 1 MB each. All images display in equal 220px-high frames without cropping.</Typography>
              {form.images.map((image, index) => (
                <Box key={index}>
                  <Box component="img" src={image} alt={`Project preview ${index + 1}`} sx={IMAGE_SX} />
                  <Button disabled={saving} onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, position) => position !== index) }))}>Remove image {index + 1}</Button>
                </Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button disabled={saving || readingImages} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || readingImages}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add project'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog open={Boolean(deleting) && isAdmin} onClose={() => { if (!deleteBusy) setDeleting(null); }} fullWidth maxWidth="xs">
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>
            Delete "{deleting?.title}" and all its images? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleteBusy} onClick={handleDelete}>
            {deleteBusy ? 'Deleting...' : 'Delete project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
