import Calendar from './pages/calendar';
import Mail from './pages/mails';
import MailViewer from './pages/mails/MailViewer';
import OauthCallback from './pages/oauth';
import Profile from './pages/profile';

const routes = [
  {
    title: 'Mails',
    path: '/',
    component: <Mail />,
  },
  {
    title: 'Emails',
    path: '/emails',
    component: <Mail />,
  },
  {
    title: 'Calendar',
    path: '/calendar',
    component: <Calendar />,
  },
  {
    title: 'Profile',
    path: '/profile',
    component: <Profile />,
  },
  {
    title: '',
    path: '/oauth/:email_type/callback',
    component: <OauthCallback />,
  },
  {
    title: 'Mail',
    path: '/emails/:address/:id',
    component: <MailViewer />,
  },
];

export default routes;
