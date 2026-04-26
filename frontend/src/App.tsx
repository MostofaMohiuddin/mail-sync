import { ConfigProvider, App as AntApp } from 'antd';
import { Route, Routes } from 'react-router-dom';
import { SWRConfig } from 'swr';

import { RequireAuth, RootGate } from './components/auth';
import Layout from './components/layout';
import { SessionProvider } from './hooks/userSession';
import { ThemeModeProvider, useThemeMode } from './hooks/useThemeMode';
import SignIn from './pages/sign-in';
import SignUp from './pages/sign-up';
import routes from './routes';
import { darkTheme, lightTheme } from './themes/Theme';

function ThemedApp() {
  const { mode } = useThemeMode();
  return (
    <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <AntApp>
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
              {/* `/` is gated separately so logged-out visitors see the landing page */}
              <Route path="/" element={<RootGate />} />
              {routes
                .filter(({ path }) => path !== '/')
                .map(({ path, component, title }) => (
                  <Route element={<RequireAuth />} key={path} path={path}>
                    <Route element={<Layout title={title}>{component}</Layout>} path="" />
                  </Route>
                ))}
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
            </Routes>
          </SessionProvider>
        </SWRConfig>
      </AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}
