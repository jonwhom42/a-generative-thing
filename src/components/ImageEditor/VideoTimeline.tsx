import { Box, Typography, Button, LinearProgress, IconButton, Tooltip } from '@mui/material';
import { MdPlayArrow, MdPause, MdAdd, MdDownload } from 'react-icons/md';
import { useState, useRef, useEffect } from 'react';
import type { GeneratedVideo } from '../../types/imageEditor';

interface VideoTimelineProps {
  video: GeneratedVideo | null;
  isGenerating: boolean;
  isExtending: boolean;
  onExtend: () => void;
  firstFrame: string | null;
  lastFrame: string | null;
}

export const VideoTimeline = ({
  video,
  isGenerating,
  isExtending,
  onExtend,
  firstFrame,
  lastFrame,
}: VideoTimelineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      const handleTimeUpdate = () => {
        setCurrentTime(videoRef.current?.currentTime || 0);
      };
      const handleEnded = () => {
        setIsPlaying(false);
      };
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      videoRef.current.addEventListener('ended', handleEnded);
      return () => {
        videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
        videoRef.current?.removeEventListener('ended', handleEnded);
      };
    }
  }, [video]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (video?.url) {
      const a = document.createElement('a');
      a.href = video.url;
      a.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canExtend = video && video.totalDuration < 148;

  return (
    <Box
      sx={{
        bgcolor: 'grey.900',
        borderTop: 1,
        borderColor: 'grey.700',
        p: 2,
      }}
    >
      {/* Loading State */}
      {(isGenerating || isExtending) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="grey.400" gutterBottom>
            {isGenerating ? 'Generating video...' : 'Extending video...'}
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Video Preview & Controls */}
      {video ? (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Video Preview */}
          <Box
            sx={{
              width: 200,
              aspectRatio: '16/9',
              bgcolor: 'black',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <video
              ref={videoRef}
              src={video.url}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <IconButton
              onClick={togglePlay}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              {isPlaying ? <MdPause /> : <MdPlayArrow />}
            </IconButton>
          </Box>

          {/* Timeline Track */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" color="grey.400">
                {formatTime(currentTime)}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 8,
                  bgcolor: 'grey.700',
                  borderRadius: 1,
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  if (videoRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    videoRef.current.currentTime = percent * video.totalDuration;
                  }
                }}
              >
                {/* Progress */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${(currentTime / video.totalDuration) * 100}%`,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                  }}
                />
                {/* Frame markers */}
                {firstFrame && (
                  <Tooltip title="First Frame">
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: -4,
                        width: 4,
                        height: 16,
                        bgcolor: 'success.main',
                        borderRadius: 0.5,
                      }}
                    />
                  </Tooltip>
                )}
                {lastFrame && (
                  <Tooltip title="Last Frame">
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: -4,
                        width: 4,
                        height: 16,
                        bgcolor: 'error.main',
                        borderRadius: 0.5,
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="caption" color="grey.400">
                {formatTime(video.totalDuration)}
              </Typography>
            </Box>

            {/* Duration info */}
            <Typography variant="caption" color="grey.500">
              Total: {video.totalDuration}s / Max: 148s
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={canExtend ? 'Extend video by 7 seconds' : 'Maximum duration reached'}>
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MdAdd />}
                  onClick={onExtend}
                  disabled={!canExtend || isExtending}
                  sx={{
                    color: 'grey.300',
                    borderColor: 'grey.600',
                    '&:hover': { borderColor: 'grey.400' },
                  }}
                >
                  Extend
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Download video">
              <IconButton
                onClick={handleDownload}
                sx={{
                  color: 'grey.300',
                  '&:hover': { color: 'white' },
                }}
              >
                <MdDownload />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ) : (
        /* Empty State */
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
          }}
        >
          <Typography variant="body2" color="grey.500">
            {isGenerating
              ? 'Video generation in progress...'
              : 'Enter a prompt and click "Create Video" to generate'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
