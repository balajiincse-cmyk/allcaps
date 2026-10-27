import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';

export const NAV_ITEMS = [
  { key: 'profile', label: 'Profile', icon: AccountCircleOutlinedIcon },
  { key: 'home', label: 'Home Dashboard', icon: DashboardOutlinedIcon },
  { key: 'projects', label: 'Projects', icon: ArticleOutlinedIcon },
  { key: 'studies', label: 'Studies & Metrics', icon: InsightsOutlinedIcon },
  { key: 'contact', label: 'Contact', icon: MailOutlineIcon },
  { key: 'admin', label: 'Manage Users', icon: AdminPanelSettingsOutlinedIcon, adminOnly: true },
];
