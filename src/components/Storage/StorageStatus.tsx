import { Box, Typography, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { MdFolder, MdCheck, MdError, MdRefresh, MdLinkOff } from 'react-icons/md';
import { useStorage } from '../../context/StorageContext';

interface StorageStatusProps {
  variant?: 'compact' | 'detailed';
  showActions?: boolean;
}

export const StorageStatus = ({
  variant = 'detailed',
  showActions = true,
}: StorageStatusProps) => {
  const { status, folderName, selectFolder, reconnect, disconnect, stats } =
    useStorage();

  if (variant === 'compact') {
    return (
      <Chip
        icon={
          status === 'connected' ? (
            <MdCheck size={16} />
          ) : status === 'error' ? (
            <MdError size={16} />
          ) : (
            <MdFolder size={16} />
          )
        }
        label={
          status === 'connected'
            ? folderName
            : status === 'connecting'
              ? 'Connecting...'
              : 'Not Connected'
        }
        color={
          status === 'connected'
            ? 'success'
            : status === 'error'
              ? 'error'
              : 'default'
        }
        size="small"
        onClick={status !== 'connected' ? selectFolder : undefined}
        sx={{ cursor: status !== 'connected' ? 'pointer' : 'default' }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 1,
        border: 1,
        borderColor: status === 'connected' ? 'success.200' : 'grey.300',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: status === 'connected' ? 'success.100' : 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MdFolder
            size={24}
            color={status === 'connected' ? '#2e7d32' : '#757575'}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={500}>
              {folderName || 'No folder selected'}
            </Typography>
            <Chip
              size="small"
              label={
                status === 'connected'
                  ? 'Connected'
                  : status === 'connecting'
                    ? 'Connecting...'
                    : status === 'error'
                      ? 'Error'
                      : 'Disconnected'
              }
              color={
                status === 'connected'
                  ? 'success'
                  : status === 'error'
                    ? 'error'
                    : 'default'
              }
            />
          </Box>

          {status === 'connected' && stats && (
            <Typography variant="caption" color="text.secondary">
              {stats.totalPosts} posts • {stats.totalProjects} projects •{' '}
              {stats.totalImages} images
            </Typography>
          )}
        </Box>
      </Box>

      {showActions && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {status === 'connected' ? (
            <>
              <Tooltip title="Change Folder">
                <Button size="small" onClick={selectFolder}>
                  Change
                </Button>
              </Tooltip>
              <Tooltip title="Disconnect">
                <IconButton size="small" onClick={disconnect}>
                  <MdLinkOff />
                </IconButton>
              </Tooltip>
            </>
          ) : status === 'disconnected' ? (
            <>
              <Tooltip title="Reconnect to Previous Folder">
                <IconButton size="small" onClick={reconnect}>
                  <MdRefresh />
                </IconButton>
              </Tooltip>
              <Button variant="contained" size="small" onClick={selectFolder}>
                Select Folder
              </Button>
            </>
          ) : null}
        </Box>
      )}
    </Box>
  );
};
