import TrackPlayer, { Event, AppKilledPlaybackBehavior, Capability } from 'react-native-track-player';

// 1. Listen for background/lock-screen button presses
export const PlaybackService = async function() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
};

// 2. Initialize the player and configure the notification bar UI
export async function setupPlayer() {
  let isSetup = false;
  try {
    // Check if player is already initialized
    await TrackPlayer.getPlaybackState();
    isSetup = true;
  } catch {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      // Buttons to show when expanded
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      // Buttons to show when collapsed in the notification bar
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
    });
    isSetup = true;
  }
  return isSetup;
}