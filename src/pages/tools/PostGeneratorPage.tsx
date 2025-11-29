import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Typography, Breadcrumbs, Link } from '@mui/material';
import { MdArrowBack } from 'react-icons/md';
import { PostGenerator } from '../../components/PostGenerator';

const PostGeneratorPage = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton
          onClick={() => navigate('/tools')}
          size="small"
          sx={{
            bgcolor: 'grey.100',
            '&:hover': { bgcolor: 'grey.200' },
          }}
        >
          <MdArrowBack size={20} />
        </IconButton>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component="button"
            underline="hover"
            color="text.secondary"
            onClick={() => navigate('/tools')}
            sx={{ cursor: 'pointer' }}
          >
            Tools
          </Link>
          <Typography color="text.primary" fontWeight={500}>
            Post Generator
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Post Generator Component */}
      <PostGenerator />
    </Box>
  );
};

export default PostGeneratorPage;
