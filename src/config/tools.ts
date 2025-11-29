import type { ReactNode } from 'react';
import { MdAutoAwesome, MdImage, MdAnalytics, MdCalendarMonth } from 'react-icons/md';
import { createElement } from 'react';

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: ReactNode;
  color: string;
  status: 'active' | 'coming-soon';
}

export const tools: ToolConfig[] = [
  {
    id: 'post-generator',
    name: 'Post Generator',
    description: 'Generate AI-powered social media content with A/B variants for multiple platforms.',
    path: '/tools/post-generator',
    icon: createElement(MdAutoAwesome, { size: 32 }),
    color: '#7C3AED',
    status: 'active',
  },
  {
    id: 'image-editor',
    name: 'Image Editor',
    description: 'Professional AI image & video editor with Gemini 3 Pro and Veo 3.1 - 4K images, video generation, and advanced editing.',
    path: '/tools/image-editor',
    icon: createElement(MdImage, { size: 32 }),
    color: '#059669',
    status: 'active',
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Track and analyze your social media performance across platforms.',
    path: '/tools/analytics',
    icon: createElement(MdAnalytics, { size: 32 }),
    color: '#0EA5E9',
    status: 'coming-soon',
  },
  {
    id: 'scheduler',
    name: 'Content Scheduler',
    description: 'Plan and schedule your content across multiple platforms.',
    path: '/tools/scheduler',
    icon: createElement(MdCalendarMonth, { size: 32 }),
    color: '#F59E0B',
    status: 'coming-soon',
  },
];

export const getToolById = (id: string): ToolConfig | undefined => {
  return tools.find((tool) => tool.id === id);
};

export const getActiveTools = (): ToolConfig[] => {
  return tools.filter((tool) => tool.status === 'active');
};
