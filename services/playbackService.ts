import { Audio } from 'expo-av';

// Initialize the player and configure background audio settings
export async function setupPlayer() {
  let isSetup = false;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    isSetup = true;
  } catch (error) {
    console.error("Failed to setup audio mode:", error);
  }
  return isSetup;
}