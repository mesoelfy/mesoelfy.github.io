// UPDATED VIDEO PLAYLIST
// Source: User Instructions (Feb 2026)
const VIDEO_POOL = [
  "9EpyGa_4D8g", // mesoelfy
  "LHMcpQ5mfEw", // OP 001-017
  "YwuhejTqLOg", // OP 001
  "wMXT9fA2CJY", // OP 002
  "9wocy3lGyLo", // OP 003
  "mVODU3WU-7w", // OP 004
  "-GcvxoUrI5I", // OP 005
  "IUY-n3Q7Mh8", // OP 005A
  "1kQ10t3cYa0", // OP 005B
  "l_a3hWGvqWU", // OP 006
  "6516ojvoYy0", // OP 007
  "yPcTDlf8vSs", // OP 008
  "nGyG250bQJE", // OP 009
  "wk1yQuYNOUk", // OP 010
  "9rYZMNdJHFQ", // OP 011
  "uUn6Mj87FGw", // OP 012
  "ESqTlXMvbJ0", // OP 013
  "IhKZFvT3Nbc", // OP 014
  "WdxFzG4UAjg", // OP 015
  "Heyz2rGfxyM", // OP 016
  "NTWiNhZ_PzY", // OP 016A
  "CL7-F4oOemY", // OP 016B (corrected from pkwjTHB4RFfJGf8C which looked like a si param)
  "dtsfby4ikHw", // OP 017
  "48pUDBwPRxA"  // OP 017.X
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

    // If literally every video in the pool is active (unlikely with 3 slots / 20+ videos), just take the top one
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
