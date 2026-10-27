import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageIcon from '@mui/icons-material/Language';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PageHeader from './PageHeader.jsx';
import { getStoredToken, updateProfile } from '../api/authApi.js';

const MAX_PHOTO_SIZE = 1.5 * 1024 * 1024;
const MAX_COVER_SIZE = 2 * 1024 * 1024;

function toProfile(user) {
  const [fallbackFirst = '', ...fallbackRest] = (user?.fullName ?? '').trim().split(/\s+/);
  const firstName = user?.firstName || fallbackFirst;
  return {
    fullName: user?.fullName ?? '',
    firstName,
    lastName: user?.lastName || fallbackRest.join(' '),
    callingName: user?.callingName || firstName,
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    whatsapp: user?.whatsapp || user?.phone || '',
    jobTitle: user?.jobTitle ?? '',
    organization: user?.organization ?? '',
    city: user?.city ?? '',
    country: user?.country ?? '',
    bio: user?.bio ?? '',
    instagram: user?.instagram ?? '',
    linkedin: user?.linkedin ?? '',
    website: user?.website ?? '',
    photo: user?.photo ?? '',
    coverImage: user?.coverImage ?? '',
  };
}

function makeWebUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
}

function getInstagramUrl(value) {
  const handle = value.trim().replace(/^@/, '');
  if (!handle) return '';
  if (/^[\w.]+$/.test(handle)) return `https://www.instagram.com/${handle}/`;
  try {
    const url = new URL(makeWebUrl(handle));
    return /(^|\.)instagram\.com$/i.test(url.hostname) ? url.toString() : '';
  } catch {
    return '';
  }
}

function getLinkedInUrl(value) {
  if (!value.trim()) return '';
  try {
    const url = new URL(makeWebUrl(value));
    return /(^|\.)linkedin\.com$/i.test(url.hostname) ? url.toString() : '';
  } catch {
    return '';
  }
}

function ProfileLink({ href, icon: Icon, label, value }) {
  if (!href || !value) return null;
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: 'primary.main', display: 'flex' }}>
        <Icon fontSize="small" />
      </Box>
      <Link href={href} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit" variant="body2">
        {label}
      </Link>
    </Stack>
  );
}

export default function ProfileView({ user, onUserUpdated }) {
  const profile = toProfile(user);
  const [draft, setDraft] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [saveError, setSaveError] = useState('');

  const location = [profile.city, profile.country].filter(Boolean).join(', ');
  const whatsappNumber = profile.whatsapp.replace(/\D/g, '');
  const whatsappUrl = whatsappNumber.length >= 8 ? `https://wa.me/${whatsappNumber}` : '';
  const instagramUrl = getInstagramUrl(profile.instagram);
  const linkedinUrl = getLinkedInUrl(profile.linkedin);
  let websiteUrl = '';
  try {
    websiteUrl = makeWebUrl(profile.website);
  } catch {
    websiteUrl = '';
  }

  const openEditor = () => {
    setDraft(profile);
    setPhotoError('');
    setSaveError('');
    setEditing(true);
  };

  const readImage = (event, field, maxSize) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPhotoError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose an image file.');
      return;
    }
    if (file.size > maxSize) {
      setPhotoError(`Choose an image smaller than ${maxSize / 1024 / 1024} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, [field]: String(reader.result) }));
    reader.onerror = () => setPhotoError('The image could not be read. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (event) => readImage(event, 'photo', MAX_PHOTO_SIZE);
  const handleCoverChange = (event) => readImage(event, 'coverImage', MAX_COVER_SIZE);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaveError('');
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setSaveError('First name and last name are required.');
      return;
    }
    if (draft.instagram.trim() && !getInstagramUrl(draft.instagram)) {
      setSaveError('Enter an Instagram username or instagram.com link.');
      return;
    }
    if (draft.linkedin.trim() && !getLinkedInUrl(draft.linkedin)) {
      setSaveError('Enter a valid linkedin.com link.');
      return;
    }
    if (draft.website.trim() && !makeValidWebsite(draft.website)) {
      setSaveError('Enter a valid website address.');
      return;
    }
    setSaving(true);
    try {
      const { user: savedUser } = await updateProfile(getStoredToken(), draft);
      onUserUpdated(savedUser);
      setEditing(false);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
      <PageHeader
        eyebrow="Your space"
        title="Profile"
        description="A little introduction, your work, and the best ways to connect."
        actions={
          <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={openEditor} sx={{ px: 2.5, py: 1.1 }}>
            Edit profile
          </Button>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.55fr) minmax(280px, 0.9fr)' }, gap: 3 }}>
        <Card sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              height: { xs: 118, sm: 156 },
              background: profile.coverImage
                ? `url("${profile.coverImage}") center / cover no-repeat`
                : 'linear-gradient(120deg, #0f172a 0%, #1d4ed8 58%, #38bdf8 100%)',
              position: 'relative',
              '&::after': profile.coverImage ? undefined : {
                content: '""',
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.18)',
                right: { xs: -75, sm: 48 },
                top: -100,
              },
            }}
          />
          <CardContent sx={{ px: { xs: 2.5, sm: 4 }, pb: 4, mt: -6, position: 'relative' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={2.5}>
              <Avatar
                src={profile.photo || undefined}
                alt={profile.fullName}
                sx={{
                  width: 112,
                  height: 112,
                  border: '4px solid white',
                  bgcolor: 'primary.main',
                  fontSize: 38,
                  fontWeight: 700,
                  boxShadow: '0 5px 18px rgba(15, 23, 42, 0.16)',
                }}
              >
                {profile.fullName.trim().charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ pb: 1, minWidth: 0 }}>
                <Typography variant="h4" component="h2" sx={{ fontSize: { xs: '1.65rem', sm: '2rem' } }}>
                  {profile.fullName || 'Your name'}
                </Typography>
                {profile.callingName && profile.callingName !== profile.firstName && (
                  <Typography variant="body2" color="text.secondary">
                    Call me {profile.callingName}
                  </Typography>
                )}
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {[profile.jobTitle, profile.organization].filter(Boolean).join(' · ') || 'Add your role and organization'}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              About
            </Typography>
            <Typography color={profile.bio ? 'text.secondary' : 'text.disabled'} sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {profile.bio || 'Add a few lines about yourself, what you do, or what you are working on.'}
            </Typography>

            <Stack direction="row" useFlexGap flexWrap="wrap" gap={2.5} sx={{ mt: 3 }}>
              {location && (
                <Stack direction="row" spacing={0.8} alignItems="center" color="text.secondary">
                  <LocationOnOutlinedIcon fontSize="small" />
                  <Typography variant="body2">{location}</Typography>
                </Stack>
              )}
              {profile.email && (
                <Stack direction="row" spacing={0.8} alignItems="center" color="text.secondary">
                  <MailOutlineIcon fontSize="small" />
                  <Typography variant="body2">{profile.email}</Typography>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6">Let’s connect</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
              Find me around the web
            </Typography>
            <Stack spacing={2.25}>
              <ProfileLink href={instagramUrl} icon={InstagramIcon} label="Instagram" value={profile.instagram} />
              <ProfileLink href={whatsappUrl} icon={WhatsAppIcon} label="WhatsApp" value={whatsappNumber} />
              <ProfileLink href={linkedinUrl} icon={LinkedInIcon} label="LinkedIn" value={profile.linkedin} />
              <ProfileLink href={websiteUrl} icon={LanguageIcon} label="Personal website" value={profile.website} />
              {profile.email && (
                <ProfileLink href={`mailto:${profile.email}`} icon={MailOutlineIcon} label="Send me an email" value={profile.email} />
              )}
              {profile.phone && (
                <ProfileLink href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`} icon={PhoneIphoneIcon} label={profile.phone} value={profile.phone} />
              )}
              {!instagramUrl && !whatsappUrl && !linkedinUrl && !websiteUrl && !profile.email && !profile.phone && (
                <Typography variant="body2" color="text.secondary">
                  Add your social links and contact details to make it easy for people to reach you.
                </Typography>
              )}
            </Stack>
            <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={openEditor} sx={{ mt: 3 }}>
              Add your links
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={editing} onClose={() => setEditing(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>Edit your profile</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              {saveError && <Alert severity="error">{saveError}</Alert>}
              {photoError && <Alert severity="error">{photoError}</Alert>}
              <Box
                sx={{
                  height: 96,
                  borderRadius: 2,
                  background: draft.coverImage
                    ? `url("${draft.coverImage}") center / cover no-repeat`
                    : 'linear-gradient(120deg, #0f172a 0%, #1d4ed8 58%, #38bdf8 100%)',
                }}
              />
              <Stack direction="row" spacing={2} alignItems="center">
                <Button component="label" variant="outlined">
                  Upload cover image
                  <input hidden type="file" accept="image/*" onChange={handleCoverChange} />
                </Button>
                {draft.coverImage && (
                  <Button color="inherit" onClick={() => setDraft((current) => ({ ...current, coverImage: '' }))}>
                    Remove
                  </Button>
                )}
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={draft.photo || undefined} alt={draft.fullName} sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                  {draft.fullName.trim().charAt(0).toUpperCase()}
                </Avatar>
                <Button component="label" variant="outlined">
                  Upload profile photo
                  <input hidden type="file" accept="image/*" onChange={handlePhotoChange} />
                </Button>
                {draft.photo && (
                  <Button color="inherit" onClick={() => setDraft((current) => ({ ...current, photo: '' }))}>
                    Remove
                  </Button>
                )}
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="First name"
                  required
                  value={draft.firstName}
                  onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))}
                />
                <TextField
                  label="Last name"
                  required
                  value={draft.lastName}
                  onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))}
                />
                <TextField
                  label="Calling name"
                  helperText="The name you like to be called."
                  value={draft.callingName}
                  onChange={(event) => setDraft((current) => ({ ...current, callingName: event.target.value }))}
                />
              </Box>
              <TextField
                label="About"
                fullWidth
                multiline
                minRows={3}
                value={draft.bio}
                onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Job title" value={draft.jobTitle} onChange={(event) => setDraft((current) => ({ ...current, jobTitle: event.target.value }))} />
                <TextField label="Organization" value={draft.organization} onChange={(event) => setDraft((current) => ({ ...current, organization: event.target.value }))} />
                <TextField label="City" value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} />
                <TextField label="Country" value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} />
                <TextField label="Email" type="email" value={draft.email} disabled helperText="Email is your sign-in ID." />
                <TextField label="Phone" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
                <TextField label="Instagram username or link" placeholder="@yourname" value={draft.instagram} onChange={(event) => setDraft((current) => ({ ...current, instagram: event.target.value }))} />
                <TextField label="WhatsApp" helperText="Use an international number, including country code." value={draft.whatsapp} onChange={(event) => setDraft((current) => ({ ...current, whatsapp: event.target.value }))} />
                <TextField label="LinkedIn profile URL" placeholder="https://linkedin.com/in/yourname" value={draft.linkedin} onChange={(event) => setDraft((current) => ({ ...current, linkedin: event.target.value }))} />
                <TextField label="Website" placeholder="yourwebsite.com" value={draft.website} onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))} />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

function makeValidWebsite(value) {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}
