import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import { MdDelete, MdAdd, MdAutoAwesome } from 'react-icons/md';
import { ProjectsDashboard } from '../components/ProjectsDashboard';
import { useStorage } from '../context/StorageContext';
import type { Project, Idea, ProjectStage, IdeaStage } from '../domain/model';

const emptyNewProject = {
  name: '',
  description: '',
  stage: 'exploring' as ProjectStage,
  targetAudience: '',
  primaryOutcome: '',
};

const emptyNewIdea = {
  title: '',
  summary: '',
  stage: 'brainstorm' as IdeaStage,
  tags: '',
  problem: '',
  audience: '',
  proposedSolution: '',
  differentiation: '',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    status,
    listWorkspaceProjects,
    saveWorkspaceProject,
    deleteWorkspaceProject,
    listIdeas,
    saveIdea,
    deleteIdea,
  } = useStorage();

  const isConnected = status === 'connected';

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Dialog state
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewIdeaDialog, setShowNewIdeaDialog] = useState(false);
  const [newProject, setNewProject] = useState(emptyNewProject);
  const [newIdea, setNewIdea] = useState(emptyNewIdea);

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'project' | 'idea';
    id: string;
    name: string;
  } | null>(null);

  // Computed values
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const projectIdeas = selectedProject
    ? ideas.filter((idea) => idea.projectId === selectedProject.id)
    : [];

  // Load data from storage
  const loadData = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [loadedProjects, loadedIdeas] = await Promise.all([
        listWorkspaceProjects(),
        listIdeas(),
      ]);
      setProjects(loadedProjects);
      setIdeas(loadedIdeas);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, listWorkspaceProjects, listIdeas]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create project
  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !isConnected) return;

    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      ownerId: 'member-001',
      memberIds: ['member-001'],
      stage: newProject.stage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetAudience: newProject.targetAudience.trim() || undefined,
      primaryOutcome: newProject.primaryOutcome.trim() || undefined,
    };

    try {
      await saveWorkspaceProject(project);
      setProjects(prev => [project, ...prev]);
      setSelectedProjectId(project.id);
      setShowNewProjectDialog(false);
      setNewProject(emptyNewProject);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  // Create idea
  const handleCreateIdea = async () => {
    if (!newIdea.title.trim() || !selectedProject || !isConnected) return;

    const idea: Idea = {
      id: `idea-${Date.now()}`,
      projectId: selectedProject.id,
      creatorId: 'member-001',
      title: newIdea.title.trim(),
      summary: newIdea.summary.trim(),
      stage: newIdea.stage,
      tags: newIdea.tags.split(',').map(t => t.trim()).filter(Boolean),
      problem: newIdea.problem.trim() || undefined,
      audience: newIdea.audience.trim() || undefined,
      proposedSolution: newIdea.proposedSolution.trim() || undefined,
      differentiation: newIdea.differentiation.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveIdea(idea);
      setIdeas(prev => [idea, ...prev]);
      setShowNewIdeaDialog(false);
      setNewIdea(emptyNewIdea);
    } catch (error) {
      console.error('Failed to save idea:', error);
    }
  };

  // Delete handlers
  const handleDeleteConfirm = async () => {
    if (!deleteDialog || !isConnected) return;

    try {
      if (deleteDialog.type === 'project') {
        await deleteWorkspaceProject(deleteDialog.id);
        setProjects(prev => prev.filter(p => p.id !== deleteDialog.id));
        setIdeas(prev => prev.filter(i => i.projectId !== deleteDialog.id));
        if (selectedProjectId === deleteDialog.id) {
          setSelectedProjectId(null);
        }
      } else {
        await deleteIdea(deleteDialog.id);
        setIdeas(prev => prev.filter(i => i.id !== deleteDialog.id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleCloseProjectDialog = () => {
    setShowNewProjectDialog(false);
    setNewProject(emptyNewProject);
  };

  const handleCloseIdeaDialog = () => {
    setShowNewIdeaDialog(false);
    setNewIdea(emptyNewIdea);
  };

  // Show storage connection prompt if not connected
  if (!isConnected) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Workspace Projects
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body1" fontWeight={500}>
            Connect to storage to manage your projects
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Go to Settings → Local Storage to select a folder where your projects and ideas will be saved.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <ProjectsDashboard
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(project) => setSelectedProjectId(project.id)}
        onNewProject={() => setShowNewProjectDialog(true)}
      />

      <Box sx={{ mt: 4 }}>
        <Divider sx={{ mb: 2 }} />
        {selectedProject ? (
          <Paper sx={{ p: 2 }}>
            {/* Project Header with Delete */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h5">
                {selectedProject.name}
              </Typography>
              <IconButton
                color="error"
                size="small"
                onClick={() => setDeleteDialog({
                  type: 'project',
                  id: selectedProject.id,
                  name: selectedProject.name,
                })}
              >
                <MdDelete />
              </IconButton>
            </Box>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {selectedProject.description}
            </Typography>
            {selectedProject.targetAudience && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Target Audience: {selectedProject.targetAudience}
              </Typography>
            )}
            {selectedProject.primaryOutcome && (
              <Typography variant="body2" color="text.secondary">
                Primary Outcome: {selectedProject.primaryOutcome}
              </Typography>
            )}

            {/* Ideas Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
              <Typography variant="h6">Ideas</Typography>
              <Button
                size="small"
                startIcon={<MdAdd />}
                onClick={() => setShowNewIdeaDialog(true)}
              >
                Add Idea
              </Button>
            </Box>
            {projectIdeas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No ideas yet for this project. Click "Add Idea" to capture your first idea.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {projectIdeas.map((idea) => (
                  <Box
                    key={idea.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {idea.title}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialog({
                          type: 'idea',
                          id: idea.id,
                          name: idea.title,
                        })}
                        sx={{ mt: -0.5, mr: -0.5 }}
                      >
                        <MdDelete size={16} />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {idea.summary}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip label={idea.stage} size="small" variant="outlined" />
                      {idea.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" sx={{ fontSize: 10 }} />
                      ))}
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        startIcon={<MdAutoAwesome />}
                        onClick={() => {
                          const params = new URLSearchParams({
                            ideaId: idea.id,
                            ideaTitle: idea.title,
                            ideaSummary: idea.summary ?? '',
                          });
                          navigate(`/tools/post-generator?${params.toString()}`);
                        }}
                      >
                        Generate Content
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a project above to see more details, or create a new project to get started.
          </Typography>
        )}
      </Box>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onClose={handleCloseProjectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={newProject.name}
            onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProject.description}
            onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Stage</InputLabel>
            <Select
              value={newProject.stage}
              label="Stage"
              onChange={(e) => setNewProject(prev => ({ ...prev, stage: e.target.value as ProjectStage }))}
            >
              <MenuItem value="exploring">Exploring</MenuItem>
              <MenuItem value="testing">Testing</MenuItem>
              <MenuItem value="launched">Launched</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Target Audience (optional)"
            fullWidth
            variant="outlined"
            value={newProject.targetAudience}
            onChange={(e) => setNewProject(prev => ({ ...prev, targetAudience: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Primary Outcome (optional)"
            fullWidth
            variant="outlined"
            placeholder='e.g., "First $100 revenue" or "Validate demand"'
            value={newProject.primaryOutcome}
            onChange={(e) => setNewProject(prev => ({ ...prev, primaryOutcome: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProjectDialog}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProject.name.trim()}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Idea Dialog */}
      <Dialog open={showNewIdeaDialog} onClose={handleCloseIdeaDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Idea</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Idea Title"
            fullWidth
            variant="outlined"
            value={newIdea.title}
            onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Summary"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={newIdea.summary}
            onChange={(e) => setNewIdea(prev => ({ ...prev, summary: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Stage</InputLabel>
            <Select
              value={newIdea.stage}
              label="Stage"
              onChange={(e) => setNewIdea(prev => ({ ...prev, stage: e.target.value as IdeaStage }))}
            >
              <MenuItem value="brainstorm">Brainstorm</MenuItem>
              <MenuItem value="shaping">Shaping</MenuItem>
              <MenuItem value="ready_to_test">Ready to Test</MenuItem>
              <MenuItem value="validated">Validated</MenuItem>
              <MenuItem value="discarded">Discarded</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Tags (comma-separated)"
            fullWidth
            variant="outlined"
            placeholder="e.g., marketing, product, content"
            value={newIdea.tags}
            onChange={(e) => setNewIdea(prev => ({ ...prev, tags: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Problem (optional)"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={newIdea.problem}
            onChange={(e) => setNewIdea(prev => ({ ...prev, problem: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Proposed Solution (optional)"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={newIdea.proposedSolution}
            onChange={(e) => setNewIdea(prev => ({ ...prev, proposedSolution: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseIdeaDialog}>Cancel</Button>
          <Button
            onClick={handleCreateIdea}
            variant="contained"
            disabled={!newIdea.title.trim()}
          >
            Add Idea
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete {deleteDialog?.type}?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            This will permanently delete "{deleteDialog?.name}"
            {deleteDialog?.type === 'project' && ' and all its ideas'}.
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

export default Dashboard;
