import Mail from './pages/mails';
import OauthCallback from './pages/oauth';
import Profile from './pages/profile';

const routes = [
  {
    title: 'Mails',
    path: '/',
    component: <Mail />,
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
];

export default routes;
