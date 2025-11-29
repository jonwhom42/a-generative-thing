import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Typography, Breadcrumbs, Link } from '@mui/material';
import { MdArrowBack } from 'react-icons/md';
import { ImageEditor } from '../../components/ImageEditor';

const ImageEditorPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 2, pt: 2 }}>
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
            Image Editor
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Image Editor Component - fills remaining space */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <ImageEditor />
      </Box>
    </Box>
  );
};

export default ImageEditorPage;
