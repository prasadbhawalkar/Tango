# MUSIC SATHI (म्युझिक साथी) - TECHNICAL USER MANUAL
*Operational Guide for Dual-Mode Multimedia Sequencing, Audio/Video Queue Processing, and Local Playlists*

---

## Welcome to Music Sathi!
**Music Sathi (म्युझिक साथी)** is an offline-first multimedia sequencer and playlist player. Since the application values your library's absolute integrity, all media files, sequence structures, and schedules are saved securely inside your browser's sandboxed local database (**IndexedDB**), providing zero-latency playback entirely offline without third-party servers.

---

## 1. Dual-Mode Interface Layout

The workspace is structured around two top-level navigation modes accessible via the central header component:
- **Play Mode `[ ▶ PLAY ]`**: Tailored for media stage viewing, real-time queues, output transport decks, and automated scheduling controls.
- **Design Mode `[ ✎ DESIGN ]`**: Tailored for building libraries, sequencing audio/video media blocks, organizing track sorting, and adjusting precise playback trims.

```
+-------------------------------------------------------------+
|  [M] Music Sathi                        [ ▶ PLAY | ✎ DESIGN ]|
+-------------------------------------------------------------+
```

---

## 2. Design Mode: Sequence Engineering

In **Design Mode** `[ ✎ DESIGN ]`, you organize playlist queues, upload raw multimedia files into local storage, set trimming range offsets, and double-count repeat loops.

### Sidebar (My Libraries)
Manage your playlist collections on the left-side index panel:
- **Active Library**: Marked with an active orange selection label `[ ACTIVE ]`. Unselected libraries display item length counts (e.g., `4 ITEMS`).
- **Create Playlist `[ + New Playlist ]`**: Tap this dashed-border slot on the bottom, type the name inside the input box labeled `name...`, and click `[ OK ]` (or press Enter) to save it immediately.
- **Import Playlist `[ Import M3U ]`**: Tap this button to upload `.m3u` indices, automatically converting external lists into local playlist blocks.

### Main Board Toolbar
Once an active playlist is selected, utilize the top action bar to append new item cards:
- **`[ + Audio/Video ]`** (Green Button): Upload standard offline media files directly into IndexedDB.
- **`[ + Playlist ]`** (Amber Button): Hover to select any of your other libraries to nest its tracks inside the active sequence sequence.
- **`[ + Silence ]`** (Indigo Button): Add a silent interval gap with custom durations.

### Playlist Item Editor Cards
Each sequenced card contains granular settings to shape playback loops:
- **Numerical Badge `( index )`**: The styled circular index badge (e.g., `( 1 )`, `( 2 )`). Click directly inside this round badge, enter a new row index, and click away to reorder your layout instantly.
- **Duplicate Row `[ Copy ]`**: Click this text link to create an identical clone of the target card.
- **Wipe Card `[ Delete ]`**: Removes the block permanently from your current sequence.
- **Plays Count `PLAYS:` Input**: Adjust loops to repeat that item `N` times before moving forward.
- **Playback Trim Input**: Enter start and end timestamp ranges inside `"Playback Trim (HH:MM:SS)"` boundaries to skip intros/outros automatically.
- **Silence Duration**: For Silence types, input the desired quiet time inside the standard time block.
- **Playlist Sync Toolbar**: 
  - **`[ 💾 Save Config ]`**: Synchronizes current list offsets. Clicking this changes the label to a green checked **`[ Checked Synchronized ]`** indicator.
  - **`[ 📥 Export M3U ]`**: Download active playlists as `.m3u` files.
  - **`[ 🔊 Purge Playlist ]`**: Clear the active library database entirely.

---

## 3. Play Mode: Active Deck & Automation

Switch to **Play Mode** `[ ▶ PLAY ]` to view continuous playbacks, timers, and scheduled programs.

### Left Main Panel: Media Stage & Scheduler
The left screen manages live playback assets:
- **Status Ring Indicator `( Index )`**: Large circular orange coordinate on top detailing active items (e.g., `( 01 )`).
- **Metadata Badge**: Standard tags displaying item files formats and loops counts (e.g., `Loop 1 / 3` | `AUDIO`).
- **Audio Viewport**: Minimal wave system display.
- **Video Viewport**: Embedded video container that scales dynamically to fit different viewports.
- **Silence Countdown Monitor**: Display showing absolute countdown clocks.
- **Missing File Warning**: If raw files are missing, are not yet uploaded, or cannot load, a warning renders saying **"No Source File Connected"**. Click **`[ Skip Track → ]`** to jump past it safely.

#### Scheduler Control: Sync Master
Located on the bottom left, this background clock listens for matching day/time routines to launch selected files automatically:
- **Digital Base Clock**: Displays current time in 24-hours military notation (e.g., `18:30:45` featuring a flashing seconds indicator).
- **Task Form `[ + New Task ]` / `[ Hide ]`**: Opens/closes the schema scheduler.
- **Schedule Controls**: Set the day dropdown (Sunday through Saturday), enter the precision 24-Hour hour-minute time, choose your target playlist, and tap **`[ Save Operation ]`**.
- **Automation Grid**: Review active tasks (e.g., `MON 18:30 Afternoon Playlist`). Click **`[ ✕ ]`** beside any routine to delete it.

### Right Sidebar Area: Live Queue Panel
Manage transitions and monitor ongoing track operations on the right side:
- **Select Playlist `-- Choose Target --`**: Choose your program from the select dropdown box to populate active queues.
- **Interactive Queue List**: Displays all tracks in the flattened program. Active cards are highlighted with a bright orange border, and completed files are green-checked. **Tap on any list card directly** to instantly jump playback focus to that item!
- **Global Transport deck**: 
  - Track navigations: previous track `[ ◀ ]` and next track `[ ▶ ]`.
  - Master pause/play toggle: Large circular orange play controller `[ ▶ / ⏸ ]` in the center.
  - Interactive volume track: Adjust audio volume from `0` to `1` or tap the speaker icon to mute/unmute.

---
*Created with care. Music Sathi (म्युझिक साथी) is a reliable local sequencing player.*
