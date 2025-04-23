import React, { useEffect, useState } from "react";
import {Linking, View, StyleSheet, TouchableOpacity, Alert, Button, DevSettings, Image } from "react-native";
import { ScrollView, Text } from "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationIndependentTree, CommonActions } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeTab from "./HomeTab";
import DetailsScreen from "./DetailsScreen";
import LocationScreen from "./LocationScreen";
import functions from "@react-native-firebase/functions";
import { updateLiveLocation, getNearbyUsers } from './getnbuser/LocationService';
import ProfileScreen from './ProfileScreen';
import ShakeDetector from './getnbuser/Shake';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';



// Define sendEmergencyAlert BEFORE it's used
export const sendEmergencyAlert = async () => {
  try {
    // 1. Get nearby users and notify them via the Cloud Function
    const nearbyUsers = await getNearbyUsers();
    if (nearbyUsers.length === 0) {
      Alert.alert("No Nearby Users", "No users within 2 km to alert.");
      return;
    }

    for (const user of nearbyUsers) {
      if (!user.fcmToken) continue; // Skip if no FCM token is available
      await functions().httpsCallable("sendEmergencyAlert")({ token: user.fcmToken });
    }
    
    // 2. Also, fetch the current user's document to get location and emergencyContacts
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user logged in when sending SMS to contacts");
    } else {
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const location = userData.location;
        const contacts = userData.emergencyContacts; // Expecting an array [{name: 'Contact Name', phone: '+1234567890'}, ...]
        
        if (location && contacts && Array.isArray(contacts)) {
          // Create a message with a Google Maps link to the location
          const message = `Emergency! My current location is: https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
          
          // For each emergency contact, open the SMS app with the pre-filled message
          contacts.forEach((contact) => {
            if (contact.phone) {
              const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
              Linking.openURL(smsUrl).catch((err) =>
                console.error(`Failed to open SMS for ${contact.phone}:`, err)
              );
            }
          });
        } else {
          console.warn("No location or emergency contacts found in user document");
        }
      } else {
        console.warn("User document not found while sending SMS to contacts");
      }
    }

    Alert.alert("Alert Sent", "Nearby users and emergency contacts have been notified.");
  } catch (error) {
    console.error("Error sending emergency alert:", error.message);
    Alert.alert("Error", "An error occurred while sending alerts.");
  }
};


const DetailScreen1 = () => <DetailsScreen title="Detail Screen 1" />;
const DetailScreen2 = () => <DetailsScreen title="Detail Screen 2" />;
const DetailScreen3 = () => <DetailsScreen title="Detail Screen 3" />;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ---------- STACK FOR HOME ----------
const HomeStack = () => {
  // Local state to hold current user's info for greeting
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    // Get current user from Firebase Auth (assumes user is already logged in)
    const { auth } = require('../firebase');
    setCurrentUser(auth.currentUser);
  }, []);
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Greeting Header */}
      <View style={styles.greetingContainer}>
        {currentUser && currentUser.photoURL ? (
          <Image
            source={{ uri: currentUser.photoURL }}
            style={styles.greetingImage}
          />
        ) : (
          <MaterialIcons name="person" size={50} color="#ccc" />
        )}
        <Text style={styles.greetingText}>
          {currentUser ? `Hello, ${currentUser.displayName || 'User'}!` : "Hello!"}
        </Text>
      </View>
      
      <View style={styles.headerContainer}>
        <Text style={styles.cardHead}>Advance Features</Text>
      </View>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeTab">
          {(props) => (
            <View style={{ flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                <HomeTab
                  {...props}
                  cards={[
                    { title: "Voice Alert", screen: "Detail1", bgcolor: "orange", icon: "mic" },
                    { title: "Geofencing", screen: "Geofencing", bgcolor: "grey", icon: "gps-fixed" },
                    { title: "Wearable integration", screen: "Detail3", bgcolor: "green", icon: "watch" },
                    { title: "Safety tips", screen: "Detail3", bgcolor: "#BA8E23", icon: "lightbulb" },
                  ]}
                />
                <ShakeDetector onEmergencyTrigger={() => console.log("Emergency Triggered!")} />
              </ScrollView>
              <Text style={styles.cardHead}>Explore more</Text>
              <ScrollView style={styles.singleCardContainer}>
                <HomeTab
                  cards={[
                    { title: "Local Alerts", screen: "Detail3", bgcolor: "#C70039", icon: "security" },
                    { title: "Call Support", screen: "Detail3", bgcolor: "blue", icon: "support-agent" },
                  ]}
                />
              </ScrollView>
              <TouchableOpacity style={styles.emergencyButton} onPress={sendEmergencyAlert}>
                <Text style={styles.emergencyButtonText}>Emergency</Text>
              </TouchableOpacity>
            </View>
          )}
        </Stack.Screen>
        <Stack.Screen name="Detail1" component={DetailScreen1} />
        <Stack.Screen name="Detail2" component={DetailScreen2} />
        <Stack.Screen name="Detail3" component={DetailScreen3} />
        <Stack.Screen name="Geofencing" component={LocationScreen} />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

// ---------- OTHER SCREENS ----------
const EmergencyScreen = () => (
  <View style={styles.centeredContainer}>
    <Text>Emergency Screen</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.centeredContainer}>
    <Text>Settings Screen</Text>
  </View>
);

// ---------- APP NAVIGATOR ----------
export default function AppNavigator() {
  useEffect(() => {
    if (__DEV__) {
      DevSettings.addMenuItem("Disable Shake Gesture", () => {
        console.log("Shake gesture disabled for emergency detection.");
      });
    }
  }, []);
  
  useEffect(() => {
    console.log("AppNavigator mounted, starting location updates.");
    updateLiveLocation(); // Immediately update once
    const interval = setInterval(updateLiveLocation, 30000); // then every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <NavigationIndependentTree>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            if (route.name === "Profile") {
              // For Profile tab, display user's profile picture if available.
              const { auth } = require('../firebase');
              const currentUser = auth.currentUser;
              if (currentUser && currentUser.photoURL) {
                return (
                  <Image
                    source={{ uri: currentUser.photoURL }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                  />
                );
              }
              return <MaterialIcons name="person" size={size} color={color} />;
            } else if (route.name === "Home") {
              return <MaterialIcons name="home" size={size} color={color} />;
            } else if (route.name === "Emergency") {
              return <MaterialIcons name="warning" size={size} color={color} />;
            } else if (route.name === "Settings") {
              return <MaterialIcons name="settings" size={size} color={color} />;
            }
            return <MaterialIcons name="error" size={size} color={color} />;
          },
          tabBarActiveTintColor: "#FF3B30",
          tabBarInactiveTintColor: "gray",
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Emergency" component={EmergencyScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationIndependentTree>
  );
}

console.log(getNearbyUsers);

const styles = StyleSheet.create({
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f7f7f7",
  },
  greetingImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerContainer: {
    padding: 10,
  },
  cardHead: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  horizontalScroll: {
    marginVertical: 10,
  },
  singleCardContainer: {
    marginTop: 12,
  },
  emergencyButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 3,
  },
  emergencyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

