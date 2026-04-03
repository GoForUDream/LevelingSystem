// Change this to your machine's local IP when testing on a physical device
// e.g. "http://192.168.1.x:8000"
// For Android emulator use "http://10.0.2.2:8000"
// For iOS simulator use "http://localhost:8000"
export const API_URL = "http://localhost:8000"

// Must match the Google OAuth client ID in backend/.env
// Register the app redirect URI (levelingsystem://auth) in Google Cloud Console
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ""
