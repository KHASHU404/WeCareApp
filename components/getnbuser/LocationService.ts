import Geolocation from "@react-native-community/geolocation";
import { auth, firestore } from '../../firebase';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';

// Request location permission (for Android)


// Revised updateLiveLocation function, modeled after your LocationScreen code:
export const updateLiveLocation = async () => {
  // Request location permission (using the same approach as your LocationScreen)
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location.",
          buttonNeutral: "Ask Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission denied", "Location access is required.");
        return;
      }
    } catch (err) {
      console.warn("Permission request error:", err);
      return;
    }
  }
  
  console.log("Permission granted. Fetching location...");

  // Fetch the current position without overriding options if defaults worked on your map screen
  Geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      console.log("Fetched coordinates:", latitude, longitude);

      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in");
        return;
      }
      console.log(`Updating Firestore for user: ${user.uid}`);

      try {
        // Update Firestore with the new location data
        await setDoc(
          doc(firestore, 'users', user.uid),
          { location: { latitude, longitude, timestamp: Date.now() } },
          { merge: true }
        );
        console.log("Firestore updated successfully");
      } catch (error) {
        console.error("Firestore update error:", error);
      }
    },
    (error) => {
      console.error("Geolocation error:", error);
      Alert.alert("Error", "Failed to fetch location. Please turn on location services.");
    }
    // We don't pass an options object here so that we use defaults that worked on your map screen.
    // If you need to adjust timeout or high accuracy, you can add an options object here.
  );
};
// Haversine formula to calculate distance between two coordinates
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};
// await updateLiveLocation();
// await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
// const users = await getNearbyUsers();
// console.log("Nearby users:", users);



// Fetch nearby users within 2 km
export const getNearbyUsers = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Get the current user's document reference and snapshot
  const userDocRef = doc(firestore, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);
  console.log('User Document Snapshot:', userDocSnap.exists(), userDocSnap.data());
  if (!userDocSnap.exists()) {
    throw new Error('User document not found');
  }
  
  const userData = userDocSnap.data();
  if (!userData.location) {
    throw new Error('User location not found');
  }
  
  const { latitude, longitude } = userData.location;

  // Get all users from the 'users' collection
  const usersCollectionRef = collection(firestore, 'users');
  const snapshot = await getDocs(usersCollectionRef);

  const nearbyUsers = snapshot.docs
    .map((docSnap) => {
      if (docSnap.id === user.uid) return null;
      const data = docSnap.data();
      if (!data.location) return null;
      const distance = getDistance(
        latitude,
        longitude,
        data.location.latitude,
        data.location.longitude
      );
      return distance <= 2 ? { id: docSnap.id, ...data } : null;
    })
    .filter((user) => user !== null);
    

  return nearbyUsers;
};
