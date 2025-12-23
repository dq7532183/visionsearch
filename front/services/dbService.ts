import { MediaItem } from '../types';

const API_BASE = '/api';

export class DBService {
  static async getAll(): Promise<MediaItem[]> {
    const res = await fetch(`${API_BASE}/media`);
    if (!res.ok) throw new Error('Failed to fetch media');
    const json = await res.json();
    return json.data;
  }

  static async uploadMedia(file: File): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }

    const json = await res.json();
    return json.data;
  }

  static async searchByText(text: string, limit: number = 10, minScore: number = 0.2, primaryModel: string = 'doubao_250615'): Promise<MediaItem[]> {
    const res = await fetch(`${API_BASE}/search/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        limit,
        minScore,
        primaryModel
      }),
    });

    if (!res.ok) throw new Error('Search failed');
    const json = await res.json();
    return json.data;
  }

  static async searchByMedia(file: File, limit: number = 10, minScore: number = 0.2, primaryModel: string = 'doubao_250615'): Promise<MediaItem[]> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('limit', limit.toString());
    formData.append('minScore', minScore.toString());
    formData.append('primaryModel', primaryModel);

    const res = await fetch(`${API_BASE}/search/media`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Search failed');
    }

    const json = await res.json();
    return json.data;
  }

  static async deleteMedia(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/media/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Delete failed');
  }
}
