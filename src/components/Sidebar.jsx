import { Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LogoutIcon from '@mui/icons-material/Logout';
import { SIDEBAR_WIDTH, sidebarTokens } from '../theme.js';

export default function Sidebar({ items, activeKey, onNavigate, variant, open, onClose, user, onSignOut }) {
  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: sidebarTokens.text }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: sidebarTokens.accent,
            color: sidebarTokens.background,
            flexShrink: 0,
          }}
        >
          <AutoAwesomeIcon />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} color={sidebarTokens.textActive}>
            ALLCAPS
          </Typography>
          <Typography variant="caption" color={sidebarTokens.textMuted}>
            Automated Layout Library & Composed Asset Publishing Server
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: sidebarTokens.border }} />

      <Typography
        variant="overline"
        sx={{ px: 3, pt: 3, pb: 1, color: sidebarTokens.textMuted, fontWeight: 700, letterSpacing: 1.2 }}
      >
        Menu
      </Typography>

      <List component="nav" disablePadding sx={{ px: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {items.map(({ key, label, icon: Icon }) => {
          const selected = key === activeKey;
          return (
            <ListItemButton
              key={key}
              selected={selected}
              onClick={() => onNavigate(key)}
              sx={{
                borderRadius: 2,
                color: sidebarTokens.text,
                '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.12)' },
                '&.Mui-selected': {
                  bgcolor: sidebarTokens.activeBg,
                  color: sidebarTokens.textActive,
                  '&:hover': { bgcolor: sidebarTokens.activeBg },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: selected ? sidebarTokens.accent : 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={label} slotProps={{ primary: { fontSize: 14, fontWeight: selected ? 600 : 500 } }} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', px: 1.5, pb: 1 }}>
        <Divider sx={{ borderColor: sidebarTokens.border, mb: 1.5 }} />
        <Typography variant="body2" fontWeight={600} color={sidebarTokens.textActive} sx={{ px: 1.5 }} noWrap>
          {user?.fullName}
        </Typography>
        <ListItemButton
          onClick={onSignOut}
          sx={{ borderRadius: 2, color: sidebarTokens.text, '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.12)' } }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign out" slotProps={{ primary: { fontSize: 14, fontWeight: 500 } }} />
        </ListItemButton>
        <Box sx={{ p: 1.5 }}>
          <Typography variant="caption" color={sidebarTokens.textMuted}>
            v1.0.0 · Vite + Material UI
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}
      slotProps={{
        paper: {
          sx: {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            bgcolor: sidebarTokens.background,
            borderRight: 'none',
          },
        },
      }}
    >
      {content}
    </Drawer>
  );
}
