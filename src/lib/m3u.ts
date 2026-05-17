/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Playlist, PlaylistItem, PlaylistItemType } from '../types';

export const exportToM3U = (playlist: Playlist, items: Record<string, PlaylistItem>): string => {
  let m3u = '#EXTM3U\n';
  playlist.itemIds.forEach(itemId => {
    const item = items[itemId];
    if (!item) return;

    if (item.type === PlaylistItemType.AUDIO || item.type === PlaylistItemType.VIDEO) {
      m3u += `#EXTINF:${Math.round(item.duration)},${item.title}\n`;
      // For local blobs, we can't export a permanent URI, but we can export the title or a placeholder
      m3u += `tango://file/${item.sourceId}\n`;
    } else if (item.type === PlaylistItemType.SILENCE) {
      m3u += `#EXTINF:${item.duration},Silence\n`;
      m3u += `tango://silence/${item.duration}\n`;
    }
  });
  return m3u;
};

// Simplified parser for demonstration - usually M3U is very varied
export const parseM3U = (content: string): Partial<Playlist> & { rawItems: any[] } => {
  const lines = content.split('\n');
  const rawItems: any[] = [];
  let currentTitle = 'Imported Item';
  let currentDuration = 0;

  lines.forEach(line => {
    if (line.startsWith('#EXTINF:')) {
      const parts = line.slice(8).split(',');
      currentDuration = parseInt(parts[0], 10) || 0;
      currentTitle = parts[1] || 'Imported Item';
    } else if (line.trim() && !line.startsWith('#')) {
      rawItems.push({
        title: currentTitle,
        duration: currentDuration,
        uri: line.trim(),
      });
    }
  });

  return { name: 'Imported Playlist', rawItems };
};
