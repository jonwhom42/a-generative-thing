import { useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MdFolder,
  MdFolderOpen,
  MdStorage,
  MdDelete,
  MdRefresh,
  MdCheckCircle,
  MdError,
  MdWarning,
  MdImage,
  MdVideoLibrary,
  MdArticle,
  MdDashboard,
} from 'react-icons/md';
import { useStorage } from '../context/StorageContext';
import { getBrowserInfo } from '../types/storage';

const Settings = () => {
  const {
    status,
    folderName,
    error,
    isSupported,
    stats,
    selectFolder,
    reconnect,
    disconnect,
    refreshStats,
  } = useStorage();

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const browserInfo = getBrowserInfo();

  const handleSelectFolder = async () => {
    await selectFolder();
  };

  const handleReconnect = async () => {
    await reconnect();
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    await disconnect();
    setIsDisconnecting(false);
    setShowDisconnectDialog(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <MdCheckCircle color="#2e7d32" size={20} />;
      case 'connecting':
        return <CircularProgress size={16} />;
      case 'error':
        return <MdError color="#d32f2f" size={20} />;
      default:
        return <MdWarning color="#757575" size={20} />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Storage Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MdStorage size={24} />
          <Typography variant="h6">Local Storage</Typography>
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={getStatusColor()}
            size="small"
            icon={getStatusIcon()}
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Store your posts, projects, and media files locally on your device using
          the File System Access API.
        </Typography>

        {/* Browser Support Warning */}
        {!isSupported && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500}>
              {browserInfo.browser} does not support local folder storage
            </Typography>
            <Typography variant="body2">
              {browserInfo.message}
            </Typography>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Connection Status */}
        {status === 'connected' && folderName && (
          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MdFolderOpen size={20} color="#1976d2" />
              <Typography fontWeight={500}>{folderName}</Typography>
            </Box>

            {stats && (
              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <MdArticle size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.totalPosts} Posts`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <MdDashboard size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.totalProjects} Projects`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <MdImage size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.totalImages} Images`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <MdVideoLibrary size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.totalVideos} Videos`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                {stats.estimatedSizeBytes > 0 && (
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <MdStorage size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`~${formatBytes(stats.estimatedSizeBytes)} estimated`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {status === 'connected' ? (
            <>
              <Button
                variant="outlined"
                startIcon={<MdFolder />}
                onClick={handleSelectFolder}
              >
                Change Folder
              </Button>
              <Button
                variant="outlined"
                startIcon={<MdRefresh />}
                onClick={refreshStats}
              >
                Refresh Stats
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<MdDelete />}
                onClick={() => setShowDisconnectDialog(true)}
              >
                Disconnect
              </Button>
            </>
          ) : status === 'connecting' ? (
            <Button variant="contained" disabled startIcon={<CircularProgress size={16} />}>
              Connecting...
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<MdFolder />}
                onClick={handleSelectFolder}
                disabled={!isSupported}
              >
                Select Folder
              </Button>
              {folderName && (
                <Button
                  variant="outlined"
                  startIcon={<MdRefresh />}
                  onClick={handleReconnect}
                >
                  Reconnect to {folderName}
                </Button>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Additional Settings Placeholder */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Additional Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          More settings coming soon...
        </Typography>
      </Paper>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onClose={() => setShowDisconnectDialog(false)}>
        <DialogTitle>Disconnect Storage?</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              This will disconnect from the current folder. Your files will remain
              on disk but you'll need to select a folder again to access them.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisconnectDialog(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
