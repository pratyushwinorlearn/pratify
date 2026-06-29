import { API_BASE } from '../constants/theme';

async function apiFetch(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'API error');
  return data.data;
}

export const api = {
  search: (q: string, type = 'songs', page = 1) =>
    apiFetch(`/search?q=${encodeURIComponent(q)}&type=${type}&page=${page}`),

  getSong: (id: string) => apiFetch(`/songs/${id}`),

  getStream: (id: string) => apiFetch(`/songs/${id}/stream`),

  getSuggestions: (id: string) => apiFetch(`/songs/${id}/suggestions`),

  getLyrics: (id: string) => apiFetch(`/songs/${id}/lyrics`),

  getHome: (lang = 'hindi,english') => apiFetch(`/home?lang=${lang}`),

  getTrending: (lang = 'hindi,english') => apiFetch(`/home/trending?lang=${lang}`),

  getAlbum: (id: string) => apiFetch(`/albums/${id}`),

  getArtist: (id: string) => apiFetch(`/artists/${id}`),
};

export type Song = {
  id: string;
  name: string;
  duration: number;
  year: string | null;
  language: string | null;
  artists: {
    primary: { id: string; name: string }[];
    featured: { id: string; name: string }[];
  };
  album: { id: string; name: string } | null;
  image: string | null;
  streamUrl: string | null;
  quality: string;
  hasLyrics: boolean;
  url: string | null;
};

export type Album = {
  id: string;
  name: string;
  year: string | null;
  image: string | null;
  artists: { id: string; name: string }[];
  songs: Song[];
  songCount: number;
};
