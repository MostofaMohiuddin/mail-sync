import { Route, Routes } from 'react-router-dom';

import Layout from './components/layout';
import SignIn from './pages/sign-in';
import SignUp from './pages/sign-up';
import routes from './routes';

export default function App() {
  const accessToken = localStorage.getItem('access_token');
  return (
    <>
      <Routes>
        {accessToken &&
          routes.map(({ path, component, title }) => (
            <Route element={<Layout title={title}>{component}</Layout>} key={path} path={path}></Route>
          ))}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>
    </>
  );
}
