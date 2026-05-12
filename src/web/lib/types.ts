export interface Project {
  id: string;
  title: string;
  html: string;
  css: string;
  pageSize: "Letter" | "A4" | "Legal";
  margin: string;
  slug?: string | null;
  isPublic?: boolean;
  viewCount?: number;
  editCount?: number;
  aiTitleGenerated?: boolean;
  description?: string | null;
  tags?: string | null;
  thumbnailKey?: string | null;
  presentMode?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectListItem {
  id: string;
  title: string;
  pageSize: string;
  updatedAt: number | string;
  createdAt: number | string;
  turns: number;
  slug?: string | null;
  isPublic?: boolean;
  viewCount?: number;
  editCount?: number;
  description?: string | null;
  tags?: string | null;
}

export interface PublicProjectSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  pageSize: string;
  viewCount: number;
  editCount: number;
  thumbnailKey: string | null;
  updatedAt: number;
  createdAt: number;
  author: { name: string | null; imageUrl: string | null } | null;
}

export interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  createdAt: number;
  snapshotId?: string | null;
}

export interface Snapshot {
  id: string;
  label: string | null;
  pageSize: string;
  margin: string;
  createdAt: number;
}

export interface ShareLink {
  slug: string;
  projectId: string;
  views: number;
  createdAt: number;
}

export interface Me {
  user: {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    plan: "free" | "pro" | "unlimited";
  };
  usage: {
    projectCount: number;
    projectLimit: number;
  };
}

export interface ChatResponse {
  reply: string;
  rawText: string;
  project: Project;
  snapshotId?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  model: string;
}
