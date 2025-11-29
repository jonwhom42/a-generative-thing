import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { MdSearch, MdGridView, MdViewList, MdInbox } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useStorage } from '../../context/StorageContext';
import type { PostSummary, ProjectSummary } from '../../types/storage';
import { FileCard } from './FileCard';

type TabValue = 'all' | 'posts' | 'projects';
type ViewMode = 'grid' | 'list';

export const FileBrowser = () => {
  const navigate = useNavigate();
  const { listPosts, listProjects, deletePost, deleteProject, loadImage } = useStorage();

  const [tab, setTab] = useState<TabValue>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'post' | 'project';
    id: string;
    name: string;
  } | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsData, projectsData] = await Promise.all([
        listPosts({ searchQuery: searchQuery || undefined }),
        listProjects({ searchQuery: searchQuery || undefined }),
      ]);
      setPosts(postsData);
      setProjects(projectsData);

      // Load thumbnails - paths need to be prefixed with posts/{id}/ or projects/{id}/
      const newThumbnails: Record<string, string> = {};
      for (const post of postsData) {
        if (post.thumbnailPath) {
          const fullPath = `posts/${post.id}/${post.thumbnailPath}`;
          const thumb = await loadImage(fullPath);
          if (thumb) newThumbnails[post.id] = thumb;
        }
      }
      for (const project of projectsData) {
        if (project.thumbnailPath) {
          const fullPath = `projects/${project.id}/${project.thumbnailPath}`;
          const thumb = await loadImage(fullPath);
          if (thumb) newThumbnails[project.id] = thumb;
        }
      }
      setThumbnails(newThumbnails);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [listPosts, listProjects, loadImage, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter data based on tab
  const filteredPosts = tab === 'projects' ? [] : posts;
  const filteredProjects = tab === 'posts' ? [] : projects;
  const allItems = [
    ...filteredPosts.map((p) => ({ ...p, type: 'post' as const })),
    ...filteredProjects.map((p) => ({ ...p, type: 'project' as const })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Handlers
  const handleOpenPost = (id: string) => {
    navigate(`/tools/post-generator?load=${id}`);
  };

  const handleOpenProject = (id: string) => {
    navigate(`/tools/image-editor?load=${id}`);
  };

  const handleDeleteClick = (type: 'post' | 'project', id: string, name: string) => {
    setDeleteDialog({ open: true, type, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;

    try {
      if (deleteDialog.type === 'post') {
        await deletePost(deleteDialog.id);
      } else {
        await deleteProject(deleteDialog.id);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleteDialog(null);
    }
  };

  const isEmpty = allItems.length === 0 && !loading;

  return (
    <Box>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="All" value="all" />
          <Tab label={`Posts (${posts.length})`} value="posts" />
          <Tab label={`Projects (${projects.length})`} value="projects" />
        </Tabs>

        {/* Search & View Toggle */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="grid">
              <MdGridView />
            </ToggleButton>
            <ToggleButton value="list">
              <MdViewList />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : isEmpty ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <MdInbox size={64} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            No content yet
          </Typography>
          <Typography variant="body2">
            Create posts or projects to see them here
          </Typography>
        </Box>
      ) : viewMode === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 2,
          }}
        >
          {allItems.map((item) => (
            <FileCard
              key={item.id}
              type={item.type}
              item={item}
              thumbnailUrl={thumbnails[item.id]}
              onOpen={item.type === 'post' ? handleOpenPost : handleOpenProject}
              onDelete={(id) =>
                handleDeleteClick(
                  item.type,
                  id,
                  item.type === 'post'
                    ? (item as PostSummary).idea
                    : (item as ProjectSummary).name
                )
              }
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {allItems.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'white',
                borderRadius: 1,
                border: 1,
                borderColor: 'grey.200',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'grey.50' },
              }}
              onClick={() =>
                item.type === 'post'
                  ? handleOpenPost(item.id)
                  : handleOpenProject(item.id)
              }
            >
              {/* Thumbnail */}
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {thumbnails[item.id] && (
                  <img
                    src={thumbnails[item.id]}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </Box>

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={500} noWrap>
                  {item.type === 'post'
                    ? (item as PostSummary).idea
                    : (item as ProjectSummary).name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.type === 'post' ? (item as PostSummary).platform : 'Project'} •{' '}
                  {new Date(item.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>

              {/* Actions */}
              <Button
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(
                    item.type,
                    item.id,
                    item.type === 'post'
                      ? (item as PostSummary).idea
                      : (item as ProjectSummary).name
                  );
                }}
              >
                Delete
              </Button>
            </Box>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete {deleteDialog?.type}?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            This will permanently delete "{deleteDialog?.name}" and all associated files.
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
