import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StorageProvider } from './context/StorageContext';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import Storage from './pages/Storage';
import Settings from './pages/Settings';
import PostGeneratorPage from './pages/tools/PostGeneratorPage';
import ImageEditorPage from './pages/tools/ImageEditorPage';

function App() {
  return (
    <StorageProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tools" element={<Tools />} />
          <Route path="tools/post-generator" element={<PostGeneratorPage />} />
          <Route path="tools/image-editor" element={<ImageEditorPage />} />
          <Route path="storage" element={<Storage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </StorageProvider>
  );
}

export default App;
