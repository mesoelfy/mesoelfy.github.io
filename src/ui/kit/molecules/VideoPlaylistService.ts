export interface VideoDef {
  id: string;
  duration: number; // Milliseconds
}

// DURATION MAPPING (User Specified) + 2000ms Buffer for loading/fade
const VIDEO_POOL: VideoDef[] = [
  { id: "9EpyGa_4D8g", duration: 275000 + 2000 }, // mesoelfy (4:35)
  { id: "LHMcpQ5mfEw", duration: 542000 + 2000 }, // OP 001-017 (9:02)
  { id: "YwuhejTqLOg", duration: 51000 + 2000 },  // OP 001 (0:51)
  { id: "wMXT9fA2CJY", duration: 40000 + 2000 },  // OP 002 (0:40)
  { id: "9wocy3lGyLo", duration: 10000 + 2000 },  // OP 003 (0:10)
  { id: "mVODU3WU-7w", duration: 43000 + 2000 },  // OP 004 (0:43)
  { id: "-GcvxoUrI5I", duration: 50000 + 2000 },  // OP 005 (0:50)
  { id: "IUY-n3Q7Mh8", duration: 30000 + 2000 },  // OP 005A (0:30)
  { id: "1kQ10t3cYa0", duration: 21000 + 2000 },  // OP 005B (0:21)
  { id: "l_a3hWGvqWU", duration: 33000 + 2000 },  // OP 006 (0:33)
  { id: "6516ojvoYy0", duration: 14000 + 2000 },  // OP 007 (0:14)
  { id: "yPcTDlf8vSs", duration: 11000 + 2000 },  // OP 008 (0:11)
  { id: "nGyG250bQJE", duration: 15000 + 2000 },  // OP 009 (0:15)
  { id: "wk1yQuYNOUk", duration: 29000 + 2000 },  // OP 010 (0:29)
  { id: "9rYZMNdJHFQ", duration: 24000 + 2000 },  // OP 011 (0:24)
  { id: "uUn6Mj87FGw", duration: 21000 + 2000 },  // OP 012 (0:21)
  { id: "ESqTlXMvbJ0", duration: 51000 + 2000 },  // OP 013 (0:51)
  { id: "IhKZFvT3Nbc", duration: 30000 + 2000 },  // OP 014 (0:30)
  { id: "WdxFzG4UAjg", duration: 16000 + 2000 },  // OP 015 (0:16)
  { id: "Heyz2rGfxyM", duration: 92000 + 2000 },  // OP 016 (1:32)
  { id: "NTWiNhZ_PzY", duration: 48000 + 2000 },  // OP 016A (0:48)
  { id: "CL7-F4oOemY", duration: 44000 + 2000 },  // OP 016B (0:44)
  { id: "dtsfby4ikHw", duration: 23000 + 2000 },  // OP 017 (0:23)
  { id: "48pUDBwPRxA", duration: 261000 + 2000 }  // OP 017.X (4:21)
];

class VideoPlaylistController {
  private deck: VideoDef[] = [];
  private active = new Set<string>();

  constructor() {
    this.reshuffle();
  }

  private reshuffle() {
    // Create a new shuffled deck
    this.deck = [...VIDEO_POOL].sort(() => Math.random() - 0.5);
    console.log('[VideoPlaylist] Deck Reshuffled');
  }

  public acquire(): VideoDef {
    // 1. Refill if needed
    if (this.deck.length === 0) {
        this.reshuffle();
    }

    // 2. Find a valid candidate
    // We iterate through the deck to find a video that isn't currently playing in another slot
    let candidateIndex = -1;

    for (let i = this.deck.length - 1; i >= 0; i--) {
        if (!this.active.has(this.deck[i].id)) {
            candidateIndex = i;
            break;
        }
    }

    // Fallback: If all are active, just take the top one
    if (candidateIndex === -1) {
        candidateIndex = this.deck.length - 1;
    }

    // 3. Extract and Track
    const video = this.deck.splice(candidateIndex, 1)[0];
    this.active.add(video.id);
    
    return video;
  }

  public release(id: string | null) {
    if (id) {
        this.active.delete(id);
    }
  }
}

export const VideoPlaylistService = new VideoPlaylistController();
