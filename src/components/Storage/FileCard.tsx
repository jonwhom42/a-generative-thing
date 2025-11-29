import { Box, Card, CardContent, Typography, IconButton, Chip, Menu, MenuItem } from '@mui/material';
import { MdMoreVert, MdDelete, MdOpenInNew, MdImage, MdArticle } from 'react-icons/md';
import { useState } from 'react';
import type { PostSummary, ProjectSummary } from '../../types/storage';

interface FileCardProps {
  type: 'post' | 'project';
  item: PostSummary | ProjectSummary;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
  thumbnailUrl?: string | null;
}

export const FileCard = ({
  type,
  item,
  onDelete,
  onOpen,
  thumbnailUrl,
}: FileCardProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(item.id);
  };

  const handleOpen = () => {
    handleMenuClose();
    onOpen(item.id);
  };

  const isPost = type === 'post';
  const post = isPost ? (item as PostSummary) : null;
  const project = !isPost ? (item as ProjectSummary) : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
      onClick={() => onOpen(item.id)}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          height: 140,
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={isPost ? post?.idea : project?.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box sx={{ color: 'grey.400' }}>
            {isPost ? <MdArticle size={48} /> : <MdImage size={48} />}
          </Box>
        )}

        {/* Type badge */}
        <Chip
          size="small"
          label={isPost ? post?.platform : 'Project'}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'rgba(255,255,255,0.9)',
            fontSize: 11,
          }}
        />

        {/* Status badge for posts */}
        {isPost && post && (
          <Chip
            size="small"
            label={post.status}
            color={
              post.status === 'published'
                ? 'success'
                : post.status === 'scheduled'
                  ? 'warning'
                  : 'default'
            }
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontSize: 11,
            }}
          />
        )}
      </Box>

      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {isPost ? post?.idea : project?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.updatedAt)}
            </Typography>
          </Box>

          <IconButton size="small" onClick={handleMenuOpen}>
            <MdMoreVert />
          </IconButton>
        </Box>

        {/* Tags */}
        {item.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {item.tags.slice(0, 2).map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
            ))}
            {item.tags.length > 2 && (
              <Chip label={`+${item.tags.length - 2}`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
            )}
          </Box>
        )}
      </CardContent>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={handleOpen}>
          <MdOpenInNew style={{ marginRight: 8 }} />
          Open
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <MdDelete style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};
