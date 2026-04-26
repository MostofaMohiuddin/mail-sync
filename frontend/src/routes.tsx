import Calendar from './pages/calendar';
import Home from './pages/home';
import Mail from './pages/mails';
import MailViewer from './pages/mails/MailViewer';
import OauthCallback from './pages/oauth';
import Profile from './pages/profile';
import ScheduleAutoReply from './pages/schedule/AutoReply';
import ScheduledMails from './pages/schedule/ScheduledMails';

const routes = [
  {
    title: 'Home',
    path: '/',
    component: <Home />,
  },
  {
    title: 'Inbox',
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
  {
    title: 'Mail',
    path: '/emails/link-mail-addresses/:address',
    component: <Mail />,
  },
  {
    title: 'Scheduled Mails',
    path: '/schedule/mails',
    component: <ScheduledMails />,
  },
  {
    title: 'Schedule Auto Reply',
    path: '/schedule/auto-reply',
    component: <ScheduleAutoReply />,
  },
];

export default routes;
