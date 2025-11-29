import { Typography, Paper, Box } from '@mui/material';

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Welcome to the Branding App dashboard. This is your central hub for
          managing all branding activities.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;
