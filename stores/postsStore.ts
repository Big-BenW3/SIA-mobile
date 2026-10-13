import { create } from 'zustand';
import { postsApi, type PostDto } from '@/services/posts.service';
import type { Comment, Difficulty, PostType } from '@/types';
import { ApiError } from '@/services/api';

// ─── Posts store (real backend) ─────────────────────────────────────
// Feed, manager, details and threads read from here. `status` drives
// loading/error shells; mutations optimistically patch memory only
// after the server confirms (no fake latency anywhere).

interface NewPost {
  courseId: string;
  courseCode: string;
  author: string;
  title: string;
  content: string;
  postType: PostType;
  difficulty: Difficulty | null;
  dueDate: string | null;
  /** Optional device attachment — sent multipart, stored in Cloudinary. */
  file?: { uri: string; name: string; mimeType: string } | null;
}

type Status = 'idle' | 'loading' | 'error';

interface PostsState {
  posts: PostDto[];
  comments: Record<string, Comment[]>;
  status: Status;
  error: string;
  load: (levelId?: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  addPost: (input: NewPost) => Promise<string>;
  updatePost: (id: string, patch: Partial<Pick<PostDto, 'title' | 'content' | 'difficulty' | 'dueDate'>>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  reset: () => void;
}

function message(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  comments: {},
  status: 'idle',
  error: '',

  load: async (levelId) => {
    set({ status: 'loading', error: '' });
    try {
      const posts = await postsApi.list(levelId);
      set({ posts, status: 'idle' });
    } catch (err) {
      set({ status: 'error', error: message(err, 'Could not load posts. Check your connection.') });
    }
  },

  loadComments: async (postId) => {
    try {
      const thread = await postsApi.comments(postId);
      set((s) => ({ comments: { ...s.comments, [postId]: thread } }));
    } catch {
      // Thread stays empty; detail still renders the post itself.
    }
  },

  addPost: async (input) => {
    const created = await postsApi.create({
      courseId: input.courseId,
      title: input.title,
      content: input.content,
      postType: input.postType,
      difficulty: input.difficulty,
      dueDate: input.dueDate,
      file: input.file ?? null,
    });
    set((s) => ({ posts: [{ ...created, mine: true }, ...s.posts] }));
    return created.id;
  },

  updatePost: async (id, patch) => {
    const updated = await postsApi.update(id, patch);
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, ...updated } : p)) }));
  },

  deletePost: async (id) => {
    await postsApi.remove(id);
    set((s) => ({
      posts: s.posts.filter((p) => p.id !== id),
      comments: Object.fromEntries(Object.entries(s.comments).filter(([k]) => k !== id)),
    }));
  },

  addComment: async (postId, content) => {
    const comment = await postsApi.addComment(postId, content);
    set((s) => ({ comments: { ...s.comments, [postId]: [...(s.comments[postId] ?? []), comment] } }));
  },

  reset: () => set({ posts: [], comments: {}, status: 'idle', error: '' }),
}));

// Drafts stay local (an unsent composer is not server data).
interface DraftState {
  draft: Partial<NewPost> | null;
  saveDraft: (d: Partial<NewPost> | null) => void;
}

export const usePostDraftStore = create<DraftState>((set) => ({
  draft: null,
  saveDraft: (draft) => set({ draft }),
}));
