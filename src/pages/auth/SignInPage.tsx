import { SignIn } from '@clerk/clerk-react';
import { Box, Paper, Typography } from '@mui/material';

const SignInPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.100',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Generative Workspace
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Sign in to your workspace
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mb: 2 }}
        >
          Access is limited to invited collaborators
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: {
                  width: '100%',
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default SignInPage;
