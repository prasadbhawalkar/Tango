/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TangoState, Playlist, PlaylistItem, ScheduledPlay } from '../types';
import { getMetadata, saveMetadata } from '../lib/db';

interface TangoContextType extends TangoState {
  setMode: (mode: 'design' | 'play') => void;
  addPlaylist: (name: string) => string;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  addItem: (item: PlaylistItem) => void;
  updateItem: (id: string, updates: Partial<PlaylistItem>) => void;
  deleteItem: (id: string, playlistId: string) => void;
  addSchedule: (schedule: Omit<ScheduledPlay, 'id'>) => void;
  removeSchedule: (id: string) => void;
  reorderItems: (playlistId: string, itemIds: string[]) => void;
  isLoaded: boolean;
}

const TangoContext = createContext<TangoContextType | undefined>(undefined);

export const TangoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TangoState>({
    playlists: {},
    items: {},
    schedules: [],
    activeMode: 'design',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence
  useEffect(() => {
    const load = async () => {
      const saved = await getMetadata('tango_state');
      if (saved) {
        setState(prev => ({ ...prev, ...saved }));
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveMetadata('tango_state', state);
    }
  }, [state, isLoaded]);

  const setMode = (activeMode: 'design' | 'play') => {
    setState(prev => ({ ...prev, activeMode }));
  };

  const addPlaylist = useCallback((name: string) => {
    const id = crypto.randomUUID();
    const newPlaylist: Playlist = {
      id,
      name,
      itemIds: [],
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      playlists: { ...prev.playlists, [id]: newPlaylist },
    }));
    return id;
  }, []);

  const updatePlaylist = (id: string, updates: Partial<Playlist>) => {
    setState(prev => ({
      ...prev,
      playlists: {
        ...prev.playlists,
        [id]: { ...prev.playlists[id], ...updates },
      },
    }));
  };

  const deletePlaylist = (id: string) => {
    setState(prev => {
      const { [id]: removed, ...rest } = prev.playlists;
      return { ...prev, playlists: rest };
    });
  };

  const addItem = (item: PlaylistItem) => {
    setState(prev => ({
      ...prev,
      items: { ...prev.items, [item.id]: item },
    }));
  };

  const updateItem = (id: string, updates: Partial<PlaylistItem>) => {
    setState(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [id]: { ...prev.items[id], ...updates },
      },
    }));
  };

  const deleteItem = (id: string, playlistId: string) => {
    setState(prev => {
      const playlist = prev.playlists[playlistId];
      if (!playlist) return prev;

      const { [id]: removedItem, ...remainingItems } = prev.items;
      return {
        ...prev,
        items: remainingItems,
        playlists: {
          ...prev.playlists,
          [playlistId]: {
            ...playlist,
            itemIds: playlist.itemIds.filter(itemId => itemId !== id),
          },
        },
      };
    });
  };

  const reorderItems = (playlistId: string, itemIds: string[]) => {
    setState(prev => ({
      ...prev,
      playlists: {
        ...prev.playlists,
        [playlistId]: {
          ...prev.playlists[playlistId],
          itemIds,
        },
      },
    }));
  };

  const addSchedule = (schedule: Omit<ScheduledPlay, 'id'>) => {
    const id = crypto.randomUUID();
    setState(prev => ({
      ...prev,
      schedules: [...prev.schedules, { ...schedule, id }],
    }));
  };

  const removeSchedule = (id: string) => {
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== id),
    }));
  };

  return (
    <TangoContext.Provider
      value={{
        ...state,
        setMode,
        addPlaylist,
        updatePlaylist,
        deletePlaylist,
        addItem,
        updateItem,
        deleteItem,
        addSchedule,
        removeSchedule,
        reorderItems,
        isLoaded,
      }}
    >
      {children}
    </TangoContext.Provider>
  );
};

export const useTango = () => {
  const context = useContext(TangoContext);
  if (!context) throw new Error('useTango must be used within TangoProvider');
  return context;
};
