import { Route, Routes } from 'react-router-dom';
import { SWRConfig } from 'swr';

import { RequireAuth } from './components/auth';
import Layout from './components/layout';
import { SessionProvider } from './hooks/userSession';
import SignIn from './pages/sign-in';
import SignUp from './pages/sign-up';
import routes from './routes';

export default function App() {
  return (
    <>
      <SWRConfig
        value={{
          revalidateIfStale: false,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
          shouldRetryOnError: false,
        }}
      >
        <SessionProvider>
          <Routes>
            {routes.map(({ path, component, title }) => (
              <Route element={<RequireAuth />} key={path} path={path}>
                <Route element={<Layout title={title}>{component}</Layout>} path="" />
              </Route>
            ))}
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
          </Routes>
        </SessionProvider>
      </SWRConfig>
    </>
  );
}
