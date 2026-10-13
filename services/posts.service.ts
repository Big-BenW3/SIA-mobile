import { API_BASE, api, getAccessToken } from './api';
import type { Difficulty, Post, PostType } from '@/types';
import type { Comment } from '@/types';

// ─── Posts + comments service (real API) ────────────────────────────
// Backend returns ISO dates; the app formats countdowns from them.

export interface PostDto extends Post {
  mine?: boolean;
}

export interface NewPostInput {
  courseId: string;
  title: string;
  content: string;
  postType: PostType;
  difficulty: Difficulty | null;
  dueDate: string | null;
  /** Optional attachment from the device picker. Sent multipart. */
  file?: { uri: string; name: string; mimeType: string } | null;
}

export const postsApi = {
  list(levelId?: string): Promise<PostDto[]> {
    const q = levelId ? `?levelId=${encodeURIComponent(levelId)}` : '';
    return api.get<PostDto[]>(`/api/posts${q}`);
  },
  detail(id: string): Promise<PostDto> {
    return api.get<PostDto>(`/api/posts/${id}`);
  },
  async create(input: NewPostInput): Promise<PostDto> {
    if (!input.file) {
      const { file: _drop, ...json } = input;
      return api.post<PostDto>('/api/posts', json);
    }
    // Multipart path: mirrors the resources upload helper.

    const form = new FormData();
    form.append('courseId', input.courseId);
    form.append('title', input.title);
    form.append('content', input.content);
    form.append('postType', input.postType);
    if (input.difficulty) form.append('difficulty', input.difficulty);
    if (input.dueDate) form.append('dueDate', input.dueDate);
    form.append('file', { uri: input.file.uri, name: input.file.name, type: input.file.mimeType } as unknown as Blob);
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      let message = `Publish failed (${res.status}).`;
      try {
        const data = (await res.json()) as { error?: { message?: string } };
        if (data.error?.message) message = data.error.message;
      } catch {
        // keep generic
      }
      const { ApiError } = await import('./api');
      throw new ApiError(res.status, message);
    }
    return (await res.json()) as PostDto;
  },
  update(id: string, patch: { title?: string; content?: string; difficulty?: Difficulty | null; dueDate?: string | null }): Promise<PostDto> {
    return api.patch<PostDto>(`/api/posts/${id}`, patch);
  },
  remove(id: string): Promise<{ ok: boolean }> {
    return api.del(`/api/posts/${id}`);
  },
  comments(postId: string): Promise<Comment[]> {
    return api.get<Comment[]>(`/api/posts/${postId}/comments`);
  },
  addComment(postId: string, content: string): Promise<Comment> {
    return api.post<Comment>(`/api/posts/${postId}/comments`, { content });
  },
};
