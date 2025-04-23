import React, { useState, useEffect, useRef } from "react";
import { Alert, View, Text, StyleSheet } from "react-native";
import { accelerometer } from "react-native-sensors";
import { filter } from "rxjs/operators";
import { sendEmergencyAlert } from "../HomeScreen";

const SHAKE_THRESHOLD = 200; // Minimum acceleration change to consider a shake
const PATTERN_SHAKES = 3; // Number of shakes required
const PATTERN_TIME = 2000; // Time limit in milliseconds

type ShakeProps = {
  onEmergencyTrigger: () => void;
};

const ShakeDetector: React.FC<ShakeProps> = ({ onEmergencyTrigger }) => {
  const [shakeCount, setShakeCount] = useState(0);
  const lastShakeTime = useRef(Date.now());

  useEffect(() => {
    const subscription = accelerometer
      .pipe(
        filter(({ x, y, z }) => Math.abs(x) + Math.abs(y) + Math.abs(z) > SHAKE_THRESHOLD)
      )
      .subscribe(() => {
        const now = Date.now();
        if (now - lastShakeTime.current < PATTERN_TIME) {
          setShakeCount((prev) => prev + 1);
        } else {
          setShakeCount(1);
        }
        lastShakeTime.current = now;
      });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (shakeCount >= PATTERN_SHAKES) {
      Alert.alert("Emergency Alert", "Shake pattern detected! Triggering emergency mode.", [
        { text: "Cancel", style: "cancel", onPress: () => setShakeCount(0) },
        { text: "Confirm", onPress: () => {onEmergencyTrigger;sendEmergencyAlert()} },
      ]);
      setShakeCount(0);
    }
  }, [shakeCount]);

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    padding: 10,
  },
});

export default ShakeDetector;
