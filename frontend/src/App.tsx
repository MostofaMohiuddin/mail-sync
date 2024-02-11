import { Route, Routes } from 'react-router-dom';

import Layout from './components/layout';
import routes from './routes';

export default function App() {
  return (
    <>
      <Routes>
        {routes.map(({ path, component, title }) => (
          <Route element={<Layout title={title}>{component}</Layout>} key={path} path={path}></Route>
        ))}
      </Routes>
    </>
  );
}
