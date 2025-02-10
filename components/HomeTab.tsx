import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet,PermissionsAndroid,Platform, TouchableOpacity, Alert } from "react-native";
import MapView, { PROVIDER_GOOGLE,Marker, Region } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";



const HomeScreen = () => {
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    // Request the current position
    const _getLocationPermission = async () => {
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
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            // Fetch location after permission is granted
            console.log("permission granted location" )
            Geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                setRegion({
                  latitude,
                  longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                });
              },

              (error) => {
                Alert.alert("Error", "Failed to fetch location.");
              }
            );
          } else {
            Alert.alert("Permission denied", "Location access is required.");
          }
        } catch (err) {
          console.warn(err);
        }
      }
    }
    _getLocationPermission();
  }, []);
  console.log(region);

  const handleEmergencyPress = () => {
    // TODO: Trigger your emergency alert functionality here
    Alert.alert("Emergency", "Emergency button pressed!");
  };

  return (
    <View style={styles.container}>
      {region ? (
        <MapView
          style={styles.map}
          initialRegion={region}
          provider={PROVIDER_GOOGLE}
          region={region}
          showsUserLocation={true}
          onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
        >
          <Marker coordinate={region} title="You are here" />
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Loading map...</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handleEmergencyPress}
      >
        <Text style={styles.emergencyButtonText}>Emergency</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: 400,
    width: 400,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});

export default HomeScreen;
