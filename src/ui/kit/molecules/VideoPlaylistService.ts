const VIDEO_POOL = [
  "oLALHbB3iXU", "A1dnxXrpN-o", "elyXcwunIYA", 
  "bHUcvHx9zlA", "Eq6EYcpWB_c", "sJyWgks1ZtA", 
  "dFlDRhvM4L0", "Ku5fgOHy1JY", "8-91y7BJ8QA"
];

class VideoPlaylistController {
  private deck: string[] = [];
  private active = new Set<string>();

  constructor() {
    this.reshuffle();
  }

  private reshuffle() {
    // Create a new shuffled deck
    this.deck = [...VIDEO_POOL].sort(() => Math.random() - 0.5);
    console.log('[VideoPlaylist] Deck Reshuffled');
  }

  public acquire(): string {
    // 1. Refill if needed
    if (this.deck.length === 0) {
        this.reshuffle();
    }

    // 2. Find a valid candidate
    // We iterate through the deck to find a video that isn't currently playing in another slot
    // (This handles the edge case where a reshuffle happens but some videos are still playing)
    let candidateIndex = -1;

    for (let i = this.deck.length - 1; i >= 0; i--) {
        if (!this.active.has(this.deck[i])) {
            candidateIndex = i;
            break;
        }
    }

    // If literally every video in the pool is active (unlikely with 3 slots / 9 videos), just take the top one
    if (candidateIndex === -1) {
        candidateIndex = this.deck.length - 1;
    }

    // 3. Extract and Track
    const videoId = this.deck.splice(candidateIndex, 1)[0];
    this.active.add(videoId);
    
    return videoId;
  }

  public release(id: string | null) {
    if (id) {
        this.active.delete(id);
    }
  }
}

export const VideoPlaylistService = new VideoPlaylistController();
