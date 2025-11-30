/**
 * Full-App ChatBot Component
 *
 * Floating chat interface in bottom-right corner with:
 * - Access to all app/project data via StorageContext
 * - Web search capabilities via Google Search grounding
 * - Function calling for full app control
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Fab,
  Paper,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Collapse,
  Avatar,
  Tooltip,
  Divider,
  Chip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Minimize as MinimizeIcon,
  OpenInFull as ExpandIcon,
} from '@mui/icons-material';
import { useStorage } from '../../context/StorageContext';
import { useAuth } from '@clerk/clerk-react';
import type { Project, Idea, Experiment } from '../../domain/model';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  };
  groundingMetadata?: {
    searchQueries?: string[];
    webSearchResults?: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  };
}

interface AppContext {
  projects: Array<{
    id: string;
    name: string;
    description: string;
    stage: string;
    targetAudience?: string;
    ideaCount: number;
  }>;
  ideas: Array<{
    id: string;
    projectId: string;
    title: string;
    summary: string;
    stage: string;
    tags: string[];
  }>;
  experiments: Array<{
    id: string;
    ideaId: string;
    name: string;
    status: string;
    channel: string;
  }>;
  summary: {
    totalProjects: number;
    totalIdeas: number;
    totalExperiments: number;
  };
}

interface ChatBotProps {
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

export default function ChatBot({ defaultCollapsed = true }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getToken } = useAuth();
  const storage = useStorage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Build app context for the chat (async)
  const buildAppContext = useCallback(async (): Promise<AppContext> => {
    const projects = await storage.listWorkspaceProjects();
    const ideas = await storage.listIdeas();
    const experiments = await storage.listExperiments();

    return {
      projects: projects.map((p: Project) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        stage: p.stage,
        targetAudience: p.targetAudience,
        ideaCount: ideas.filter((i: Idea) => i.projectId === p.id).length,
      })),
      ideas: ideas.map((i: Idea) => ({
        id: i.id,
        projectId: i.projectId,
        title: i.title,
        summary: i.summary,
        stage: i.stage,
        tags: i.tags,
      })),
      experiments: experiments.map((e: Experiment) => ({
        id: e.id,
        ideaId: e.ideaId,
        name: e.name,
        status: e.status,
        channel: e.channel,
      })),
      summary: {
        totalProjects: projects.length,
        totalIdeas: ideas.length,
        totalExperiments: experiments.length,
      },
    };
  }, [storage]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const appContext = await buildAppContext();

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          appContext,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Chat request failed');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        functionCall: data.functionCall,
        groundingMetadata: data.groundingMetadata,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If there was a function call, execute it
      if (data.functionCall) {
        await handleFunctionCall(data.functionCall);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFunctionCall = async (functionCall: ChatMessage['functionCall']) => {
    if (!functionCall) return;

    const { name, args } = functionCall;

    try {
      switch (name) {
        case 'createProject': {
          const newProject: Project = {
            id: crypto.randomUUID(),
            name: args.name as string,
            description: (args.description as string) || '',
            ownerId: 'current-user',
            memberIds: [],
            stage: (args.stage as Project['stage']) || 'exploring',
            targetAudience: args.targetAudience as string | undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await storage.saveWorkspaceProject(newProject);
          break;
        }
        case 'updateProject': {
          const existingProject = await storage.getWorkspaceProject(args.id as string);
          if (existingProject) {
            const updates = args.updates as Partial<Project>;
            const updatedProject: Project = {
              ...existingProject,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            await storage.saveWorkspaceProject(updatedProject);
          }
          break;
        }
        case 'deleteProject':
          await storage.deleteWorkspaceProject(args.id as string);
          break;
        case 'createIdea': {
          const newIdea: Idea = {
            id: crypto.randomUUID(),
            projectId: args.projectId as string,
            creatorId: 'current-user',
            title: args.title as string,
            summary: (args.summary as string) || '',
            stage: (args.stage as Idea['stage']) || 'brainstorm',
            tags: (args.tags as string[]) || [],
            problem: args.problem as string | undefined,
            audience: args.audience as string | undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await storage.saveIdea(newIdea);
          break;
        }
        case 'updateIdea': {
          const existingIdea = await storage.getIdea(args.id as string);
          if (existingIdea) {
            const updates = args.updates as Partial<Idea>;
            const updatedIdea: Idea = {
              ...existingIdea,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            await storage.saveIdea(updatedIdea);
          }
          break;
        }
        case 'deleteIdea':
          await storage.deleteIdea(args.id as string);
          break;
        case 'createExperiment': {
          const newExperiment: Experiment = {
            id: crypto.randomUUID(),
            ideaId: args.ideaId as string,
            ownerId: 'current-user',
            name: args.name as string,
            status: (args.status as Experiment['status']) || 'planned',
            hypothesis: (args.hypothesis as string) || '',
            method: (args.method as string) || '',
            channel: (args.channel as string) || 'Other',
            metricName: '',
            targetValue: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await storage.saveExperiment(newExperiment);
          break;
        }
        case 'updateExperiment': {
          const existingExperiment = await storage.getExperiment(args.id as string);
          if (existingExperiment) {
            const updates = args.updates as Partial<Experiment>;
            const updatedExperiment: Experiment = {
              ...existingExperiment,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            await storage.saveExperiment(updatedExperiment);
          }
          break;
        }
        default:
          console.warn(`Unknown function: ${name}`);
      }
    } catch (error) {
      console.error(`Function call failed: ${name}`, error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 2,
      }}
    >
      {/* Chat Window */}
      <Collapse in={isOpen} unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            width: 400,
            height: isMinimized ? 56 : 600,
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'height 0.3s ease',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BotIcon />
              <Typography variant="subtitle1" fontWeight="bold">
                Branding Assistant
              </Typography>
            </Box>
            <Box>
              <IconButton
                size="small"
                onClick={toggleMinimize}
                sx={{ color: 'inherit' }}
              >
                {isMinimized ? <ExpandIcon /> : <MinimizeIcon />}
              </IconButton>
              <IconButton
                size="small"
                onClick={toggleOpen}
                sx={{ color: 'inherit' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: 'grey.50',
                }}
              >
                {messages.length === 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      gap: 2,
                      color: 'text.secondary',
                    }}
                  >
                    <BotIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                    <Typography variant="body2" textAlign="center">
                      Hi! I'm your branding assistant. I can help you:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                      <Chip label="Create projects" size="small" />
                      <Chip label="Manage ideas" size="small" />
                      <Chip label="Search the web" size="small" />
                      <Chip label="Generate content" size="small" />
                    </Box>
                  </Box>
                )}

                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: message.role === 'user' ? 'secondary.main' : 'primary.main',
                      }}
                    >
                      {message.role === 'user' ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
                    </Avatar>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        maxWidth: '80%',
                        bgcolor: message.role === 'user' ? 'secondary.light' : 'background.paper',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>

                      {/* Show function call info */}
                      {message.functionCall && (
                        <Box sx={{ mt: 1 }}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            Action: {message.functionCall.name}
                          </Typography>
                        </Box>
                      )}

                      {/* Show grounding/search info */}
                      {message.groundingMetadata?.webSearchResults && (
                        <Box sx={{ mt: 1 }}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            Sources:
                          </Typography>
                          {message.groundingMetadata.webSearchResults.slice(0, 3).map((result, idx) => (
                            <Typography
                              key={idx}
                              variant="caption"
                              component="a"
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ display: 'block', color: 'primary.main' }}
                            >
                              {result.title}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Paper>
                  </Box>
                ))}

                {isLoading && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <BotIcon fontSize="small" />
                    </Avatar>
                    <CircularProgress size={20} />
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Input Area */}
              <Box
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 1,
                }}
              >
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  size="small"
                  placeholder="Ask me anything..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  multiline
                  maxRows={3}
                />
                <Tooltip title="Send message">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading}
                    >
                      <SendIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </>
          )}
        </Paper>
      </Collapse>

      {/* Floating Action Button */}
      {!isOpen && (
        <Tooltip title="Open chat assistant" placement="left">
          <Fab
            color="primary"
            onClick={toggleOpen}
            sx={{
              boxShadow: 4,
              '&:hover': {
                transform: 'scale(1.1)',
              },
              transition: 'transform 0.2s',
            }}
          >
            <ChatIcon />
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
}
