import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  StorageState,
  StorageContextValue,
  StoredPost,
  StoredProject,
  AppSettings,
  PostSummary,
  ProjectSummary,
  PostFilter,
  ProjectFilter,
} from '../types/storage';
import {
  DEFAULT_STORAGE_STATE,
  isFileSystemAccessSupported,
  getBrowserInfo,
} from '../types/storage';
import { storageService } from '../services/storage';

const StorageContext = createContext<StorageContextValue | null>(null);

interface StorageProviderProps {
  children: ReactNode;
}

export const StorageProvider = ({ children }: StorageProviderProps) => {
  const [state, setState] = useState<StorageState>(() => ({
    ...DEFAULT_STORAGE_STATE,
    isSupported: isFileSystemAccessSupported(),
  }));

  // Initialize on mount - try to reconnect to previously selected folder
  useEffect(() => {
    const initStorage = async () => {
      if (!state.isSupported) return;

      setState((prev) => ({ ...prev, status: 'connecting' }));

      try {
        const connected = await storageService.initialize();
        if (connected) {
          const stats = await storageService.getStats();
          setState((prev) => ({
            ...prev,
            status: 'connected',
            folderName: storageService.getFolderName(),
            stats,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            status: 'disconnected',
            folderName: null,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: (error as Error).message,
        }));
      }
    };

    initStorage();
  }, [state.isSupported]);

  // Select folder
  const selectFolder = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      const info = getBrowserInfo();
      setState((prev) => ({
        ...prev,
        error: info.message,
      }));
      return false;
    }

    setState((prev) => ({ ...prev, status: 'connecting', error: null }));

    try {
      const handle = await storageService.selectFolder();
      if (handle) {
        const stats = await storageService.getStats();
        setState((prev) => ({
          ...prev,
          status: 'connected',
          folderName: handle.name,
          stats,
          error: null,
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          status: 'disconnected',
        }));
        return false;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: (error as Error).message,
      }));
      return false;
    }
  }, [state.isSupported]);

  // Reconnect
  const reconnect = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    setState((prev) => ({ ...prev, status: 'connecting', error: null }));

    try {
      const connected = await storageService.reconnect();
      if (connected) {
        const stats = await storageService.getStats();
        setState((prev) => ({
          ...prev,
          status: 'connected',
          folderName: storageService.getFolderName(),
          stats,
          error: null,
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          status: 'disconnected',
          error: 'Failed to reconnect. Please select a folder again.',
        }));
        return false;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: (error as Error).message,
      }));
      return false;
    }
  }, [state.isSupported]);

  // Disconnect
  const disconnect = useCallback(async () => {
    await storageService.disconnect();
    setState((prev) => ({
      ...prev,
      status: 'disconnected',
      folderName: null,
      stats: null,
      error: null,
    }));
  }, []);

  // Posts
  const savePost = useCallback(
    async (post: StoredPost, images: Map<string, string>): Promise<void> => {
      if (!storageService.isInitialized()) {
        throw new Error('Storage not connected');
      }
      await storageService.savePost(post, images);
      await refreshStats();
    },
    []
  );

  const getPost = useCallback(
    async (id: string): Promise<StoredPost | null> => {
      if (!storageService.isInitialized()) return null;
      return storageService.getPost(id);
    },
    []
  );

  const listPosts = useCallback(
    async (filter?: PostFilter): Promise<PostSummary[]> => {
      if (!storageService.isInitialized()) return [];
      return storageService.listPosts(filter);
    },
    []
  );

  const deletePost = useCallback(async (id: string): Promise<void> => {
    if (!storageService.isInitialized()) return;
    await storageService.deletePost(id);
    await refreshStats();
  }, []);

  // Projects
  const saveProject = useCallback(
    async (project: StoredProject, files: Map<string, string>): Promise<void> => {
      if (!storageService.isInitialized()) {
        throw new Error('Storage not connected');
      }
      await storageService.saveProject(project, files);
      await refreshStats();
    },
    []
  );

  const getProject = useCallback(
    async (id: string): Promise<StoredProject | null> => {
      if (!storageService.isInitialized()) return null;
      return storageService.getProject(id);
    },
    []
  );

  const listProjects = useCallback(
    async (filter?: ProjectFilter): Promise<ProjectSummary[]> => {
      if (!storageService.isInitialized()) return [];
      return storageService.listProjects(filter);
    },
    []
  );

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    if (!storageService.isInitialized()) return;
    await storageService.deleteProject(id);
    await refreshStats();
  }, []);

  // Settings
  const saveSettings = useCallback(
    async (settings: AppSettings): Promise<void> => {
      if (!storageService.isInitialized()) return;
      await storageService.saveSettings(settings);
    },
    []
  );

  const getSettings = useCallback(async (): Promise<AppSettings | null> => {
    if (!storageService.isInitialized()) return null;
    return storageService.getSettings();
  }, []);

  // Files
  const loadImage = useCallback(
    async (path: string): Promise<string | null> => {
      if (!storageService.isInitialized()) return null;
      return storageService.loadImage(path);
    },
    []
  );

  const loadVideo = useCallback(
    async (path: string): Promise<string | null> => {
      if (!storageService.isInitialized()) return null;
      return storageService.loadVideo(path);
    },
    []
  );

  // Stats
  const refreshStats = useCallback(async (): Promise<void> => {
    if (!storageService.isInitialized()) return;
    const stats = await storageService.getStats();
    setState((prev) => ({ ...prev, stats }));
  }, []);

  const value: StorageContextValue = {
    ...state,
    selectFolder,
    reconnect,
    disconnect,
    savePost,
    getPost,
    listPosts,
    deletePost,
    saveProject,
    getProject,
    listProjects,
    deleteProject,
    saveSettings,
    getSettings,
    loadImage,
    loadVideo,
    refreshStats,
  };

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextValue => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
