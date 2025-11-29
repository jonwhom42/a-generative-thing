// StorageService - Core CRUD operations using File System Access API

import type {
  StoredPost,
  StoredProject,
  AppSettings,
  PostSummary,
  ProjectSummary,
  PostIndex,
  ProjectIndex,
  StorageStats,
  PostFilter,
  ProjectFilter,
} from '../../types/storage';
import { DEFAULT_APP_SETTINGS } from '../../types/storage';
import {
  saveDirectoryHandle,
  getDirectoryHandle,
  clearDirectoryHandle,
} from './IndexedDBHelper';

class StorageService {
  private rootHandle: FileSystemDirectoryHandle | null = null;
  private initialized = false;

  // ============================================
  // Initialization & Connection
  // ============================================

  async initialize(): Promise<boolean> {
    try {
      const handle = await getDirectoryHandle();
      if (handle) {
        const hasPermission = await this.verifyPermission(handle);
        if (hasPermission) {
          this.rootHandle = handle;
          this.initialized = true;
          await this.ensureFolderStructure();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      return false;
    }
  }

  async selectFolder(): Promise<FileSystemDirectoryHandle | null> {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      await saveDirectoryHandle(handle);
      this.rootHandle = handle;
      this.initialized = true;
      await this.ensureFolderStructure();

      return handle;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled
        return null;
      }
      console.error('Failed to select folder:', error);
      throw error;
    }
  }

  async reconnect(): Promise<boolean> {
    const handle = await getDirectoryHandle();
    if (!handle) return false;

    try {
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        this.rootHandle = handle;
        this.initialized = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await clearDirectoryHandle();
    this.rootHandle = null;
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized && this.rootHandle !== null;
  }

  getFolderName(): string | null {
    return this.rootHandle?.name || null;
  }

  // ============================================
  // Permission Management
  // ============================================

  private async verifyPermission(
    handle: FileSystemDirectoryHandle
  ): Promise<boolean> {
    try {
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') return true;

      if (permission === 'prompt') {
        const newPermission = await handle.requestPermission({ mode: 'readwrite' });
        return newPermission === 'granted';
      }

      return false;
    } catch {
      return false;
    }
  }

  async hasPermission(): Promise<boolean> {
    if (!this.rootHandle) return false;
    return this.verifyPermission(this.rootHandle);
  }

  // ============================================
  // Folder Structure
  // ============================================

  private async ensureFolderStructure(): Promise<void> {
    if (!this.rootHandle) return;

    const folders = ['posts', 'projects', 'settings', 'exports'];
    for (const folder of folders) {
      await this.rootHandle.getDirectoryHandle(folder, { create: true });
    }
  }

  private async getSubdirectory(
    path: string,
    create = false
  ): Promise<FileSystemDirectoryHandle | null> {
    if (!this.rootHandle) return null;

    try {
      const parts = path.split('/').filter(Boolean);
      let current = this.rootHandle;

      for (const part of parts) {
        current = await current.getDirectoryHandle(part, { create });
      }

      return current;
    } catch {
      return null;
    }
  }

  // ============================================
  // File Operations
  // ============================================

  private async writeFile(path: string, content: string | Blob): Promise<void> {
    if (!this.rootHandle) throw new Error('Storage not initialized');

    const parts = path.split('/');
    const fileName = parts.pop()!;
    const dirPath = parts.join('/');

    const dir = await this.getSubdirectory(dirPath, true);
    if (!dir) throw new Error(`Could not create directory: ${dirPath}`);

    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();

    if (typeof content === 'string') {
      await writable.write(content);
    } else {
      await writable.write(content);
    }

    await writable.close();
  }

  private async readFile(path: string): Promise<string | null> {
    if (!this.rootHandle) return null;

    try {
      const parts = path.split('/');
      const fileName = parts.pop()!;
      const dirPath = parts.join('/');

      const dir = await this.getSubdirectory(dirPath);
      if (!dir) return null;

      const fileHandle = await dir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  }

  private async readFileAsDataUrl(path: string): Promise<string | null> {
    if (!this.rootHandle) return null;

    try {
      const parts = path.split('/');
      const fileName = parts.pop()!;
      const dirPath = parts.join('/');

      const dir = await this.getSubdirectory(dirPath);
      if (!dir) return null;

      const fileHandle = await dir.getFileHandle(fileName);
      const file = await fileHandle.getFile();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch {
      return null;
    }
  }

  // Reserved for future file-level deletion
  // @ts-expect-error Reserved for future use
  private async _deleteFile(path: string): Promise<void> {
    if (!this.rootHandle) return;

    try {
      const parts = path.split('/');
      const fileName = parts.pop()!;
      const dirPath = parts.join('/');

      const dir = await this.getSubdirectory(dirPath);
      if (!dir) return;

      await dir.removeEntry(fileName);
    } catch {
      // File might not exist
    }
  }

  private async deleteDirectory(path: string): Promise<void> {
    if (!this.rootHandle) return;

    try {
      const parts = path.split('/');
      const dirName = parts.pop()!;
      const parentPath = parts.join('/');

      const parent = parentPath
        ? await this.getSubdirectory(parentPath)
        : this.rootHandle;

      if (parent) {
        await parent.removeEntry(dirName, { recursive: true });
      }
    } catch {
      // Directory might not exist
    }
  }

  // ============================================
  // Posts CRUD
  // ============================================

  async savePost(post: StoredPost, images: Map<string, string>): Promise<void> {
    if (!this.rootHandle) throw new Error('Storage not initialized');

    const postDir = `posts/${post.id}`;

    // Save images
    for (const [key, dataUrl] of images.entries()) {
      const blob = await this.dataUrlToBlob(dataUrl);
      await this.writeFile(`${postDir}/${key}`, blob);
    }

    // Save metadata
    await this.writeFile(`${postDir}/metadata.json`, JSON.stringify(post, null, 2));

    // Update index
    await this.updatePostIndex(post);
  }

  async getPost(id: string): Promise<StoredPost | null> {
    const content = await this.readFile(`posts/${id}/metadata.json`);
    if (!content) return null;

    try {
      return JSON.parse(content) as StoredPost;
    } catch {
      return null;
    }
  }

  async listPosts(filter?: PostFilter): Promise<PostSummary[]> {
    const index = await this.getPostIndex();
    if (!index) return [];

    let posts = index.posts;

    if (filter) {
      if (filter.platform) {
        posts = posts.filter((p) => p.platform === filter.platform);
      }
      if (filter.status) {
        posts = posts.filter((p) => p.status === filter.status);
      }
      if (filter.tags && filter.tags.length > 0) {
        posts = posts.filter((p) =>
          filter.tags!.some((tag) => p.tags.includes(tag))
        );
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        posts = posts.filter((p) => p.idea.toLowerCase().includes(query));
      }
      if (filter.dateFrom) {
        posts = posts.filter((p) => p.createdAt >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        posts = posts.filter((p) => p.createdAt <= filter.dateTo!);
      }
    }

    return posts.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async deletePost(id: string): Promise<void> {
    await this.deleteDirectory(`posts/${id}`);
    await this.removeFromPostIndex(id);
  }

  private async getPostIndex(): Promise<PostIndex | null> {
    const content = await this.readFile('posts/index.json');
    if (!content) return { version: 1, lastUpdated: new Date().toISOString(), posts: [] };

    try {
      return JSON.parse(content) as PostIndex;
    } catch {
      return { version: 1, lastUpdated: new Date().toISOString(), posts: [] };
    }
  }

  private async updatePostIndex(post: StoredPost): Promise<void> {
    const index = (await this.getPostIndex()) || {
      version: 1,
      lastUpdated: new Date().toISOString(),
      posts: [],
    };

    const summary: PostSummary = {
      id: post.id,
      platform: post.platform,
      idea: post.idea,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      thumbnailPath: post.variants.A.imagePath,
      tags: post.tags,
    };

    const existingIndex = index.posts.findIndex((p) => p.id === post.id);
    if (existingIndex >= 0) {
      index.posts[existingIndex] = summary;
    } else {
      index.posts.push(summary);
    }

    index.lastUpdated = new Date().toISOString();
    await this.writeFile('posts/index.json', JSON.stringify(index, null, 2));
  }

  private async removeFromPostIndex(id: string): Promise<void> {
    const index = await this.getPostIndex();
    if (!index) return;

    index.posts = index.posts.filter((p) => p.id !== id);
    index.lastUpdated = new Date().toISOString();
    await this.writeFile('posts/index.json', JSON.stringify(index, null, 2));
  }

  // ============================================
  // Projects CRUD
  // ============================================

  async saveProject(
    project: StoredProject,
    files: Map<string, string>
  ): Promise<void> {
    if (!this.rootHandle) throw new Error('Storage not initialized');

    const projectDir = `projects/${project.id}`;

    // Save files (images, videos)
    for (const [key, dataUrl] of files.entries()) {
      const blob = await this.dataUrlToBlob(dataUrl);
      await this.writeFile(`${projectDir}/${key}`, blob);
    }

    // Save metadata
    await this.writeFile(
      `${projectDir}/metadata.json`,
      JSON.stringify(project, null, 2)
    );

    // Update index
    await this.updateProjectIndex(project);
  }

  async getProject(id: string): Promise<StoredProject | null> {
    const content = await this.readFile(`projects/${id}/metadata.json`);
    if (!content) return null;

    try {
      return JSON.parse(content) as StoredProject;
    } catch {
      return null;
    }
  }

  async listProjects(filter?: ProjectFilter): Promise<ProjectSummary[]> {
    const index = await this.getProjectIndex();
    if (!index) return [];

    let projects = index.projects;

    if (filter) {
      if (filter.tags && filter.tags.length > 0) {
        projects = projects.filter((p) =>
          filter.tags!.some((tag) => p.tags.includes(tag))
        );
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        projects = projects.filter((p) => p.name.toLowerCase().includes(query));
      }
      if (filter.dateFrom) {
        projects = projects.filter((p) => p.createdAt >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        projects = projects.filter((p) => p.createdAt <= filter.dateTo!);
      }
    }

    return projects.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async deleteProject(id: string): Promise<void> {
    await this.deleteDirectory(`projects/${id}`);
    await this.removeFromProjectIndex(id);
  }

  private async getProjectIndex(): Promise<ProjectIndex | null> {
    const content = await this.readFile('projects/index.json');
    if (!content)
      return { version: 1, lastUpdated: new Date().toISOString(), projects: [] };

    try {
      return JSON.parse(content) as ProjectIndex;
    } catch {
      return { version: 1, lastUpdated: new Date().toISOString(), projects: [] };
    }
  }

  private async updateProjectIndex(project: StoredProject): Promise<void> {
    const index = (await this.getProjectIndex()) || {
      version: 1,
      lastUpdated: new Date().toISOString(),
      projects: [],
    };

    const summary: ProjectSummary = {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      thumbnailPath: project.currentImagePath,
      historyCount: project.history.length,
      tags: project.tags,
    };

    const existingIndex = index.projects.findIndex((p) => p.id === project.id);
    if (existingIndex >= 0) {
      index.projects[existingIndex] = summary;
    } else {
      index.projects.push(summary);
    }

    index.lastUpdated = new Date().toISOString();
    await this.writeFile('projects/index.json', JSON.stringify(index, null, 2));
  }

  private async removeFromProjectIndex(id: string): Promise<void> {
    const index = await this.getProjectIndex();
    if (!index) return;

    index.projects = index.projects.filter((p) => p.id !== id);
    index.lastUpdated = new Date().toISOString();
    await this.writeFile('projects/index.json', JSON.stringify(index, null, 2));
  }

  // ============================================
  // Settings
  // ============================================

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.writeFile(
      'settings/app-settings.json',
      JSON.stringify(settings, null, 2)
    );
  }

  async getSettings(): Promise<AppSettings> {
    const content = await this.readFile('settings/app-settings.json');
    if (!content) return DEFAULT_APP_SETTINGS;

    try {
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(content) };
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  }

  // ============================================
  // File Loading
  // ============================================

  async loadImage(path: string): Promise<string | null> {
    return this.readFileAsDataUrl(path);
  }

  async loadVideo(path: string): Promise<string | null> {
    return this.readFileAsDataUrl(path);
  }

  // ============================================
  // Stats
  // ============================================

  async getStats(): Promise<StorageStats> {
    const postIndex = await this.getPostIndex();
    const projectIndex = await this.getProjectIndex();

    const posts = postIndex?.posts || [];
    const projects = projectIndex?.projects || [];

    // Count images and videos (rough estimate)
    // Each post has 2 variants with images
    const postImages = posts.length * 2;
    // Each project has current image plus history
    const projectImages = projects.reduce((sum, p) => sum + p.historyCount + 1, 0);
    const totalImages = postImages + projectImages;
    const totalVideos = 0; // TODO: count actual videos

    const allDates = [
      ...posts.map((p) => p.createdAt),
      ...projects.map((p) => p.createdAt),
    ].sort();

    return {
      totalPosts: posts.length,
      totalProjects: projects.length,
      totalImages,
      totalVideos,
      estimatedSizeBytes: 0, // Would need to iterate files to calculate
      oldestContent: allDates[0] || null,
      newestContent: allDates[allDates.length - 1] || null,
    };
  }

  // ============================================
  // Utilities
  // ============================================

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }
}

// Export singleton instance
export const storageService = new StorageService();
