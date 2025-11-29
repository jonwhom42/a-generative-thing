// Domain Model Types
// Core types for collaborative brand/business ideation workspace

// ============================================================================
// Member Types
// ============================================================================

export type MemberRole = 'owner' | 'collaborator';

export interface Member {
  id: string;
  name: string;
  email?: string;
  role?: MemberRole;
  avatarUrl?: string;
  createdAt: string;
}

// ============================================================================
// Project Types
// ============================================================================

export type ProjectStage = 'exploring' | 'testing' | 'launched' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string; // references Member.id
  memberIds: string[]; // references Member.id
  stage: ProjectStage;
  createdAt: string;
  updatedAt: string;
  targetAudience?: string;
  primaryOutcome?: string; // e.g. "first $100 revenue", "validate demand"
}

// ============================================================================
// Idea Types
// ============================================================================

export type IdeaStage =
  | 'brainstorm'
  | 'shaping'
  | 'ready_to_test'
  | 'validated'
  | 'discarded';

export interface Idea {
  id: string;
  projectId: string; // references Project.id
  creatorId: string; // references Member.id
  title: string;
  summary: string;
  stage: IdeaStage;
  tags: string[];
  problem?: string;
  audience?: string;
  proposedSolution?: string;
  differentiation?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Experiment Types
// ============================================================================

export type ExperimentStatus = 'planned' | 'running' | 'completed' | 'cancelled';

export interface Experiment {
  id: string;
  ideaId: string; // references Idea.id
  ownerId: string; // references Member.id
  name: string;
  status: ExperimentStatus;
  hypothesis: string; // free text for now
  method: string; // what we'll actually do (LP, ad, outreach, etc.)
  channel: string; // where (Reddit, Meta ads, email, etc.)
  metricName: string; // e.g. "signups", "replies", "purchases"
  targetValue: number;
  timeFrame?: string;
  actualValue?: number;
  notes?: string;
  learned?: string;
  createdAt: string;
  updatedAt: string;
}
