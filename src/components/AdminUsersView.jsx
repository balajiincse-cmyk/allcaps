import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveModeratorOutlinedIcon from '@mui/icons-material/RemoveModeratorOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PageHeader from './PageHeader.jsx';
import {
  adminDeleteUser,
  adminGetUser,
  adminListUsers,
  adminSetRole,
  adminUpdateUser,
  getStoredToken,
} from '../api/authApi.js';

const EDIT_FIELDS = [
  ['firstName', 'First name'],
  ['lastName', 'Last name'],
  ['callingName', 'Calling name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['whatsapp', 'WhatsApp'],
  ['organization', 'Organization'],
  ['jobTitle', 'Job title'],
  ['city', 'City'],
  ['country', 'Country'],
  ['instagram', 'Instagram'],
  ['linkedin', 'LinkedIn'],
  ['website', 'Website'],
];

const DETAIL_ROWS = [...EDIT_FIELDS, ['bio', 'Bio']];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

export default function AdminUsersView({ user: currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('view');
  const [draft, setDraft] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { users: list } = await adminListUsers(getStoredToken());
      setUsers(list);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((item) =>
      [item.fullName, item.callingName, item.email, item.organization, item.city, item.country]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [users, query]);

  const replaceUser = (updated) => setUsers((list) => list.map((item) => (item.id === updated.id ? updated : item)));

  const openUser = async (id, nextMode) => {
    setDialogError('');
    setMode(nextMode);
    setSelected({ id });
    try {
      const { user } = await adminGetUser(getStoredToken(), id);
      setSelected(user);
      setDraft(user);
    } catch (requestError) {
      setDialogError(requestError.message);
    }
  };

  const closeDialog = () => {
    setSelected(null);
    setDraft(null);
    setDialogError('');
  };

  const handleSave = async () => {
    setBusy(true);
    setDialogError('');
    try {
      const { user } = await adminUpdateUser(getStoredToken(), selected.id, draft);
      replaceUser(user);
      setSelected(user);
      setDraft(user);
      setMode('view');
      setNotice(`Saved changes for ${user.fullName}.`);
    } catch (requestError) {
      setDialogError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRole = async (target) => {
    setError('');
    setNotice('');
    try {
      const role = target.role === 'admin' ? 'user' : 'admin';
      const { user } = await adminSetRole(getStoredToken(), target.id, role);
      replaceUser(user);
      setNotice(role === 'admin' ? `${user.fullName} is now an admin.` : `Admin access removed for ${user.fullName}.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDelete = async () => {
    const target = deleting;
    setBusy(true);
    try {
      await adminDeleteUser(getStoredToken(), target.id);
      setUsers((list) => list.filter((item) => item.id !== target.id));
      setNotice(`Deleted ${target.fullName}.`);
      setDeleting(null);
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const cannotChange = (target) => target.id === currentUser.id || target.isOwner;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        eyebrow="Admin"
        title="Manage Users"
        description="View, edit or delete user profiles, and decide who has admin access."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search by name, email, organization or location"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {item.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.organization || '—'}</TableCell>
                    <TableCell>{[item.city, item.country].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.role === 'admin' ? 'Admin' : 'User'}
                        color={item.role === 'admin' ? 'primary' : 'default'}
                        variant={item.role === 'admin' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openUser(item.id, 'view')}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openUser(item.id, 'edit')}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          cannotChange(item) && item.role === 'admin'
                            ? 'This admin access cannot be removed'
                            : item.role === 'admin'
                              ? 'Remove admin access'
                              : 'Make admin'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color={item.role === 'admin' ? 'warning' : 'primary'}
                            disabled={cannotChange(item) && item.role === 'admin'}
                            onClick={() => handleRole(item)}
                          >
                            {item.role === 'admin' ? (
                              <RemoveModeratorOutlinedIcon fontSize="small" />
                            ) : (
                              <AdminPanelSettingsOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={cannotChange(item) ? 'This account cannot be deleted' : 'Delete'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={cannotChange(item)}
                            onClick={() => setDeleting(item)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={Boolean(selected)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{mode === 'edit' ? 'Edit user' : 'User details'}</DialogTitle>
        <DialogContent dividers>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          {!draft ? (
            !dialogError && (
              <Box sx={{ p: 4, display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
              </Box>
            )
          ) : mode === 'view' ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={selected.photo || undefined} sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                  {selected.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selected.fullName}</Typography>
                  <Chip size="small" label={selected.role === 'admin' ? 'Admin' : 'User'} />
                </Box>
              </Stack>
              {DETAIL_ROWS.map(([key, label]) => (
                <Box key={key}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selected[key] || '—'}
                  </Typography>
                </Box>
              ))}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Joined
                </Typography>
                <Typography variant="body2">{formatDate(selected.createdAt)}</Typography>
              </Box>
            </Stack>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              {EDIT_FIELDS.map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  value={draft[key] ?? ''}
                  required={key === 'firstName' || key === 'lastName' || key === 'email'}
                  disabled={key === 'email' && selected.isOwner}
                  onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                />
              ))}
              <TextField
                label="Bio"
                multiline
                minRows={3}
                value={draft.bio ?? ''}
                onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                sx={{ gridColumn: '1 / -1' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog}>Close</Button>
          {draft && mode === 'view' && (
            <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => setMode('edit')}>
              Edit
            </Button>
          )}
          {draft && mode === 'edit' && (
            <Button variant="contained" disabled={busy} onClick={handleSave}>
              {busy ? 'Saving...' : 'Save changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete this user?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleting?.fullName} ({deleting?.email}) and all of their profile data will be permanently deleted. This
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={busy} onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
