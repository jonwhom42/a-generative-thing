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
import { MdDelete, MdAdd, MdAutoAwesome, MdScience } from 'react-icons/md';
import { ProjectsDashboard } from '../components/ProjectsDashboard';
import { useStorage } from '../context/StorageContext';
import type { Project, Idea, Experiment, ProjectStage, IdeaStage, ExperimentStatus } from '../domain/model';
import type { PostSummary } from '../types/storage';

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

const emptyNewExperiment = {
  name: '',
  hypothesis: '',
  method: '',
  channel: '',
  metricName: '',
  targetValue: '',
  status: 'planned' as ExperimentStatus,
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
    listPosts,
    listExperiments,
    saveExperiment,
    deleteExperiment,
  } = useStorage();

  const isConnected = status === 'connected';

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Dialog state
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewIdeaDialog, setShowNewIdeaDialog] = useState(false);
  const [showNewExperimentDialog, setShowNewExperimentDialog] = useState(false);
  const [experimentDialogIdeaId, setExperimentDialogIdeaId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState(emptyNewProject);
  const [newIdea, setNewIdea] = useState(emptyNewIdea);
  const [newExperiment, setNewExperiment] = useState(emptyNewExperiment);

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'project' | 'idea' | 'experiment';
    id: string;
    name: string;
  } | null>(null);

  // Computed values
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const projectIdeas = selectedProject
    ? ideas.filter((idea) => idea.projectId === selectedProject.id)
    : [];

  // Group posts by ideaId
  const postsByIdeaId = new Map<string, PostSummary[]>();
  for (const post of posts) {
    if (!post.ideaId) continue;
    const arr = postsByIdeaId.get(post.ideaId) || [];
    arr.push(post);
    postsByIdeaId.set(post.ideaId, arr);
  }

  // Group experiments by ideaId
  const experimentsByIdeaId = new Map<string, Experiment[]>();
  for (const exp of experiments) {
    const arr = experimentsByIdeaId.get(exp.ideaId) || [];
    arr.push(exp);
    experimentsByIdeaId.set(exp.ideaId, arr);
  }

  // Load data from storage
  const loadData = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [loadedProjects, loadedIdeas, loadedPosts, loadedExperiments] = await Promise.all([
        listWorkspaceProjects(),
        listIdeas(),
        listPosts(),
        listExperiments(),
      ]);
      setProjects(loadedProjects);
      setIdeas(loadedIdeas);
      setPosts(loadedPosts);
      setExperiments(loadedExperiments);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, listWorkspaceProjects, listIdeas, listPosts, listExperiments]);

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

  // Create experiment
  const handleCreateExperiment = async () => {
    if (!newExperiment.name.trim() || !newExperiment.hypothesis.trim() || !experimentDialogIdeaId || !isConnected) return;

    const experiment: Experiment = {
      id: `exp-${Date.now()}`,
      ideaId: experimentDialogIdeaId,
      ownerId: 'member-001',
      name: newExperiment.name.trim(),
      status: newExperiment.status,
      hypothesis: newExperiment.hypothesis.trim(),
      method: newExperiment.method.trim(),
      channel: newExperiment.channel.trim(),
      metricName: newExperiment.metricName.trim(),
      targetValue: newExperiment.targetValue ? parseFloat(newExperiment.targetValue) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveExperiment(experiment);
      setExperiments(prev => [experiment, ...prev]);
      setShowNewExperimentDialog(false);
      setNewExperiment(emptyNewExperiment);
      setExperimentDialogIdeaId(null);
    } catch (error) {
      console.error('Failed to save experiment:', error);
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
        setExperiments(prev => prev.filter(e => {
          const idea = ideas.find(i => i.id === e.ideaId);
          return idea?.projectId !== deleteDialog.id;
        }));
        if (selectedProjectId === deleteDialog.id) {
          setSelectedProjectId(null);
        }
      } else if (deleteDialog.type === 'idea') {
        await deleteIdea(deleteDialog.id);
        setIdeas(prev => prev.filter(i => i.id !== deleteDialog.id));
        setExperiments(prev => prev.filter(e => e.ideaId !== deleteDialog.id));
      } else if (deleteDialog.type === 'experiment') {
        await deleteExperiment(deleteDialog.id);
        setExperiments(prev => prev.filter(e => e.id !== deleteDialog.id));
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

  const handleOpenExperimentDialog = (ideaId: string) => {
    setExperimentDialogIdeaId(ideaId);
    setShowNewExperimentDialog(true);
  };

  const handleCloseExperimentDialog = () => {
    setShowNewExperimentDialog(false);
    setNewExperiment(emptyNewExperiment);
    setExperimentDialogIdeaId(null);
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
                    {(() => {
                      const relatedPosts = postsByIdeaId.get(idea.id) || [];
                      if (relatedPosts.length === 0) return null;
                      return (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Posts from this idea:
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                            {relatedPosts.slice(0, 3).map((post) => (
                              <Typography
                                key={post.id}
                                variant="caption"
                                sx={{ display: 'block' }}
                              >
                                • [{post.platform}] {post.idea.slice(0, 40)}{post.idea.length > 40 ? '...' : ''}
                              </Typography>
                            ))}
                            {relatedPosts.length > 3 && (
                              <Typography variant="caption" color="text.secondary">
                                + {relatedPosts.length - 3} more…
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })()}

                    {/* Experiments Section */}
                    <Box sx={{ mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Experiments
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<MdScience size={14} />}
                          onClick={() => handleOpenExperimentDialog(idea.id)}
                          sx={{ fontSize: 11, py: 0 }}
                        >
                          Add
                        </Button>
                      </Box>
                      {(() => {
                        const ideaExperiments = experimentsByIdeaId.get(idea.id) || [];
                        if (ideaExperiments.length === 0) {
                          return (
                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                              No experiments yet for this idea.
                            </Typography>
                          );
                        }
                        return (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {ideaExperiments.map((exp) => (
                              <Box
                                key={exp.id}
                                sx={{
                                  p: 0.75,
                                  borderRadius: 0.5,
                                  backgroundColor: 'action.hover',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                      {exp.name}
                                    </Typography>
                                    <Chip
                                      label={exp.status}
                                      size="small"
                                      color={
                                        exp.status === 'completed' ? 'success' :
                                        exp.status === 'running' ? 'info' :
                                        exp.status === 'cancelled' ? 'warning' : 'default'
                                      }
                                      sx={{ fontSize: 9, height: 16 }}
                                    />
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {exp.hypothesis}
                                  </Typography>
                                  {exp.metricName && (
                                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: 10 }}>
                                      Metric: {exp.metricName} (target: {exp.targetValue})
                                    </Typography>
                                  )}
                                </Box>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteDialog({
                                    type: 'experiment',
                                    id: exp.id,
                                    name: exp.name,
                                  })}
                                  sx={{ ml: 0.5, p: 0.25 }}
                                >
                                  <MdDelete size={14} />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        );
                      })()}
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

      {/* New Experiment Dialog */}
      <Dialog open={showNewExperimentDialog} onClose={handleCloseExperimentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Experiment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Experiment Name"
            fullWidth
            variant="outlined"
            value={newExperiment.name}
            onChange={(e) => setNewExperiment(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Hypothesis"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="If we... then... because..."
            value={newExperiment.hypothesis}
            onChange={(e) => setNewExperiment(prev => ({ ...prev, hypothesis: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newExperiment.status}
              label="Status"
              onChange={(e) => setNewExperiment(prev => ({ ...prev, status: e.target.value as ExperimentStatus }))}
            >
              <MenuItem value="planned">Planned</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Method (optional)"
            fullWidth
            variant="outlined"
            placeholder="How will you run this experiment?"
            value={newExperiment.method}
            onChange={(e) => setNewExperiment(prev => ({ ...prev, method: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Channel (optional)"
            fullWidth
            variant="outlined"
            placeholder="e.g., LinkedIn, Email, Landing Page"
            value={newExperiment.channel}
            onChange={(e) => setNewExperiment(prev => ({ ...prev, channel: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              margin="dense"
              label="Metric Name (optional)"
              fullWidth
              variant="outlined"
              placeholder="e.g., Conversion Rate"
              value={newExperiment.metricName}
              onChange={(e) => setNewExperiment(prev => ({ ...prev, metricName: e.target.value }))}
            />
            <TextField
              margin="dense"
              label="Target Value"
              type="number"
              variant="outlined"
              sx={{ width: 150 }}
              value={newExperiment.targetValue}
              onChange={(e) => setNewExperiment(prev => ({ ...prev, targetValue: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExperimentDialog}>Cancel</Button>
          <Button
            onClick={handleCreateExperiment}
            variant="contained"
            disabled={!newExperiment.name.trim() || !newExperiment.hypothesis.trim()}
          >
            Add Experiment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
