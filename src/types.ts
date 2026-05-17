/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PlaylistItemType {
  AUDIO = 'audio',
  VIDEO = 'video',
  PLAYLIST = 'playlist',
  SILENCE = 'silence',
}

export interface PlaylistItem {
  id: string;
  type: PlaylistItemType;
  title: string;
  sourceId?: string; // ID for File/Blob in IndexedDB
  playlistId?: string; // ID if type is PLAYLIST
  duration: number; // in seconds
  start: number; // trim start
  end: number; // trim end
  repeatCount: number; // default 1
}

export interface Playlist {
  id: string;
  name: string;
  itemIds: string[]; // Ordered list of item IDs
  createdAt: number;
}

export interface ScheduledPlay {
  id: string;
  playlistId: string;
  day: number; // 0-6 (Sun-Sat)
  time: string; // "HH:mm"
  active: boolean;
}

export interface TangoState {
  playlists: Record<string, Playlist>;
  items: Record<string, PlaylistItem>;
  schedules: ScheduledPlay[];
  activeMode: 'design' | 'play';
}
