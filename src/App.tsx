import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Layout } from './components/Layout';
import { StorageProvider } from './context/StorageContext';
import { GeminiAuthProvider } from './context/GeminiAuthContext';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import Storage from './pages/Storage';
import Settings from './pages/Settings';
import PostGeneratorPage from './pages/tools/PostGeneratorPage';
import ImageEditorPage from './pages/tools/ImageEditorPage';
import { SignInPage, SignUpPage } from './pages/auth';
import { ChatBot } from './components/ChatBot';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Protected app routes */}
        <Route
          path="/*"
          element={
            <>
              {/* Redirect unauthenticated users to sign-in */}
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>

              {/* Authenticated users get the full app */}
              <SignedIn>
                <GeminiAuthProvider>
                  <StorageProvider>
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
                    {/* Floating ChatBot - available on all authenticated pages */}
                    <ChatBot />
                  </StorageProvider>
                </GeminiAuthProvider>
              </SignedIn>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
