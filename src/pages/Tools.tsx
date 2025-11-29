import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
} from '@mui/material';
import { tools } from '../config/tools';

const Tools = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Tools
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        AI-powered tools to supercharge your social media presence.
      </Typography>

      <Grid container spacing={3}>
        {tools.map((tool) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tool.id}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                border: '1px solid',
                borderColor: 'divider',
                opacity: tool.status === 'coming-soon' ? 0.7 : 1,
                '&:hover': {
                  transform: tool.status === 'active' ? 'translateY(-4px)' : 'none',
                  boxShadow: tool.status === 'active' ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
                  borderColor: tool.status === 'active' ? tool.color : 'divider',
                },
              }}
            >
              <CardActionArea
                onClick={() => tool.status === 'active' && navigate(tool.path)}
                disabled={tool.status === 'coming-soon'}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  p: 0,
                }}
              >
                <CardContent sx={{ width: '100%', p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${tool.color}15`,
                        color: tool.color,
                      }}
                    >
                      {tool.icon}
                    </Box>
                    {tool.status === 'coming-soon' && (
                      <Chip
                        label="Coming Soon"
                        size="small"
                        sx={{
                          bgcolor: 'grey.100',
                          color: 'text.secondary',
                          fontWeight: 500,
                          fontSize: 11,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {tool.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tool.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Tools;
