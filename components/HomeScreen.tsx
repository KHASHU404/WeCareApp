import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ScrollView, Text } from "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeTab from "./HomeTab";
import DetailsScreen from "./DetailsScreen";

// Updated import: call a Cloud Function instead of messaging().sendMessage()
import functions from "@react-native-firebase/functions";
import { updateLiveLocation, getNearbyUsers } from "./getnbuser/LocationService";

// ---------- COMPONENTS / SCREENS ----------
const LiveLocationScreen = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      updateLiveLocation();
    }, 30000); // Update location every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.liveLocationContainer}>
      <Text style={styles.liveLocationText}>WeCare Home</Text>
    </View>
  );
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DetailScreen1 = () => <DetailsScreen title="Detail Screen 1" />;
const DetailScreen2 = () => <DetailsScreen title="Detail Screen 2" />;
const DetailScreen3 = () => <DetailsScreen title="Detail Screen 3" />;

// ---------- EMERGENCY ALERT FUNCTION ----------
const sendEmergencyAlert = async () => {
  try {
    // 1. Get nearby users
    const nearbyUsers = await getNearbyUsers();

    if (nearbyUsers.length === 0) {
      Alert.alert("No Nearby Users", "No users within 2 km to alert.");
      return;
    }

    // 2. For each user, call the Cloud Function with their token
    for (const user of nearbyUsers) {
      if (!user.fcmToken) continue; // skip if no token
      await functions().httpsCallable("sendEmergencyAlert")({
        token: user.fcmToken,
      });
    }

    Alert.alert("Alert Sent", "Nearby users have been notified.");
  } catch (error) {
    console.error("Error sending emergency alert:", error.message);
    Alert.alert("Error", "An error occurred while sending alerts.");
  }
};

// ---------- STACK FOR HOME ----------
const HomeStack = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
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
                    { title: "Geofencing", screen: "Detail2", bgcolor: "grey", icon: "gps-fixed" },
                    { title: "Wearable integration", screen: "Detail3", bgcolor: "green", icon: "watch" },
                    { title: "Safety tips", screen: "Detail3", bgcolor: "#BA8E23", icon: "lightbulb" },
                  ]}
                />
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
const ProfileScreen = () => (
  <View style={styles.centeredContainer}>
    <Text>Profile Screen</Text>
  </View>
);
const SettingsScreen = () => (
  <View style={styles.centeredContainer}>
    <Text>Settings Screen</Text>
  </View>
);

// ---------- APP NAVIGATOR ----------
export default function AppNavigator() {
  return (
    <NavigationIndependentTree>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === "Home") iconName = "home";
            else if (route.name === "Emergency") iconName = "warning";
            else if (route.name === "Profile") iconName = "person";
            else if (route.name === "Settings") iconName = "settings";
            return <MaterialIcons name={iconName || "error"} size={size} color={color} />;
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

// ---------- STYLES ----------
const styles = StyleSheet.create({
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
  liveLocationContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  liveLocationText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
