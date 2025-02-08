import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native'; // ✅ Use Firebase's built-in method
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// ✅ Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '448337353788-1c1qoi6joh9g4unbfom48c34tu4djkg3.apps.googleusercontent.com',
  offlineAccess: true,
});

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBELfHFKN3ZQHlC3GTFpw_uOIZ77Yjpchk',
  authDomain: 'wecareapp-6c802.firebaseapp.com', // ✅ Removed extra space
  projectId: 'wecareapp-6c802',
  storageBucket: 'wecareapp-6c802.appspot.com', // ✅ Fixed storageBucket format
  messagingSenderId: '448337353788', // 🔹 Add this from Firebase Console
  appId: '1:448337353788:android:cdab2e30729a03e8d07739',
};

// ✅ Prevent multiple Firebase instances
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Use Firebase's official method for persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ Initialize Firestore
export const firestore = getFirestore(app);