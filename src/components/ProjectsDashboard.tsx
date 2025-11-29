import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
} from '@mui/material';
import { MdAdd } from 'react-icons/md';
import type { Project, ProjectStage } from '../domain/model';

interface ProjectsDashboardProps {
  projects: Project[];
  onSelectProject?: (project: Project) => void;
  selectedProjectId?: string | null;
  onNewProject?: () => void;
}

// Stage badge color mapping
const stageColors: Record<ProjectStage, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
  exploring: 'info',
  testing: 'warning',
  launched: 'success',
  archived: 'default',
};

const stageLabels: Record<ProjectStage, string> = {
  exploring: 'Exploring',
  testing: 'Testing',
  launched: 'Launched',
  archived: 'Archived',
};

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  onSelectProject,
  selectedProjectId,
  onNewProject,
}) => {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Workspace Projects</Typography>
        <Button
          variant="contained"
          startIcon={<MdAdd />}
          sx={{ textTransform: 'none' }}
          onClick={onNewProject}
        >
          New Project
        </Button>
      </Box>

      {/* Projects Grid */}
      <Grid container spacing={3}>
        {projects.map((project) => {
          const isSelected = selectedProjectId === project.id;
          return (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
            <Card
              onClick={() => onSelectProject?.(project)}
              role="button"
              tabIndex={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
                border: isSelected ? 2 : 1,
                borderColor: isSelected ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Project Name & Stage */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
                    {project.name}
                  </Typography>
                  <Chip
                    label={stageLabels[project.stage]}
                    color={stageColors[project.stage]}
                    size="small"
                  />
                </Box>

                {/* Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {project.description}
                </Typography>

                {/* Primary Outcome */}
                <Box
                  sx={{
                    mt: 'auto',
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Primary Outcome
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: project.primaryOutcome ? 'normal' : 'italic',
                      color: project.primaryOutcome ? 'text.primary' : 'text.disabled',
                    }}
                  >
                    {project.primaryOutcome || 'No primary outcome set yet'}
                  </Typography>
                </Box>

                {/* Team Size Indicator */}
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {project.memberIds.length} {project.memberIds.length === 1 ? 'member' : 'members'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ProjectsDashboard;
