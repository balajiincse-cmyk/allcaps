import { useEffect, useState } from 'react';
import { AppBar, Box, CircularProgress, IconButton, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './components/Sidebar.jsx';
import HomeView from './components/HomeView.jsx';
import ProjectsView from './components/ProjectsView.jsx';
import StudiesView from './components/StudiesView.jsx';
import ContactView from './components/ContactView.jsx';
import ProfileView from './components/ProfileView.jsx';
import AdminUsersView from './components/AdminUsersView.jsx';
import SignInView from './components/SignInView.jsx';
import SignUpView from './components/SignUpView.jsx';
import { NAV_ITEMS } from './data/navigation.js';
import { clearStoredToken, fetchCurrentUser, getStoredToken, storeToken } from './api/authApi.js';

const VIEWS = {
  home: HomeView,
  projects: ProjectsView,
  studies: StudiesView,
  contact: ContactView,
  profile: ProfileView,
  admin: AdminUsersView,
};

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(() => Boolean(getStoredToken()));
  const [authView, setAuthView] = useState('signin');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetchCurrentUser(token)
      .then(({ user }) => setSession({ token, user }))
      .catch(() => clearStoredToken())
      .finally(() => setCheckingSession(false));
  }, []);

  const showSignUp = (email = '', notice = '') => {
    setSignUpEmail(email);
    setAuthNotice(notice);
    setAuthView('signup');
  };

  const showSignIn = () => {
    setAuthNotice('');
    setAuthView('signin');
  };

  const handleSignedIn = (nextSession) => {
    storeToken(nextSession.token);
    setAuthNotice('');
    setSession(nextSession);
  };

  const handleSignOut = () => {
    clearStoredToken();
    setSession(null);
    showSignIn();
  };

  if (checkingSession) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    if (authView === 'signup') {
      return (
        <SignUpView
          initialEmail={signUpEmail}
          notice={authNotice}
          onSignedUp={handleSignedIn}
          onSwitchToSignIn={showSignIn}
        />
      );
    }
    return (
      <SignInView
        onSignedIn={handleSignedIn}
        onProfileNotFound={(email) => showSignUp(email, 'No profile found for this email. Create one to continue.')}
        onSwitchToSignUp={() => showSignUp()}
      />
    );
  }

  return (
    <Dashboard
      user={session.user}
      onSignOut={handleSignOut}
      onUserUpdated={(user) => setSession((current) => ({ ...current, user }))}
    />
  );
}

function Dashboard({ user, onSignOut, onUserUpdated }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [activeKey, setActiveKey] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === 'admin');
  const ActiveView = navItems.some((item) => item.key === activeKey) ? VIEWS[activeKey] : VIEWS.profile;
  const activeLabel = navItems.find((item) => item.key === activeKey)?.label;

  const handleNavigate = (key) => {
    setActiveKey(key);
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        items={navItems}
        activeKey={activeKey}
        onNavigate={handleNavigate}
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop || mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onSignOut={onSignOut}
      />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ display: { md: 'none' }, borderBottom: 1, borderColor: 'divider' }}
        >
          <Toolbar>
            <IconButton edge="start" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1 }}>
              {activeLabel}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 } }}>
          <ActiveView user={user} onUserUpdated={onUserUpdated} />
        </Box>
      </Box>
    </Box>
  );
}
