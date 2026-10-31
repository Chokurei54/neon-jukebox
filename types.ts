
export interface VideoTrack {
  id: string;
  rank: number;
  title: string;
  artist: string;
  youtubeUrl: string;
  description?: string;
}

export interface JukeboxState {
  tracks: VideoTrack[];
  currentTrackId: string | null;
  theme: string;
}

export enum JukeboxAction {
  SET_TRACK = 'SET_TRACK',
  UPDATE_TRACK = 'UPDATE_TRACK',
  SET_THEME = 'SET_THEME',
  AUTO_FILL = 'AUTO_FILL'
}
