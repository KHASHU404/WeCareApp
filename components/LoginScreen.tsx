import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image
} from 'react-native';
import { auth, firestore } from '../firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { NavigationProp } from '@react-navigation/native';

type Props = {
  navigation: NavigationProp<any>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '448337353788-1c1qoi6joh9g4unbfom48c34tu4djkg3.apps.googleusercontent.com', // Replace with Firebase Web Client ID
      offlineAccess: true,
    });
  }, []);

  // Handle manual email & password login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
  
      // Fetch user data from Firestore
      const userDocRef = doc(firestore, "users", uid);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists() && !userDoc.data()?.phone) {
        Alert.alert("Phone Verification Needed", "Please verify your phone number.");
        navigation.navigate("PhoneVerification", { uid });
      } else {
        navigation.navigate("Home");  // Proceed to home if phone is verified
      }
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    }
  };
  

  // Handle Google Sign-In
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const googleUser = await GoogleSignin.signIn();
  
      // Get Google authentication credentials
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('No ID token returned from Google Sign-In.');
  
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
  
      const { uid, email, displayName } = userCredential.user;
      const userDocRef = doc(firestore, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          username: displayName || "User",
          email,
          phone: "",  // Empty phone, must be verified
          dob: "",
          createdAt: new Date().toISOString(),
        });
      }
  
      // Re-fetch user data after saving
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists() && !updatedUserDoc.data()?.phone) {
        Alert.alert("Phone Verification Needed", "Please verify your phone number.");
        navigation.navigate("PhoneVerification", { uid });
      } else {
        navigation.navigate("Home");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Google Login Cancelled", "User cancelled login.");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Google Login In Progress", "Please wait...");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Google Login Error", "Google Play Services not available.");
      } else {
        Alert.alert("Google Login Failed", error.message);
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor='grey'
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholderTextColor='grey'
          placeholder="Password"
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
          value={password}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showButton}>
          <Text style={styles.showButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      <Button title="Login" onPress={handleLogin} />

      {/* Google Sign-In Button */}
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Image source={require('../assets/google.png')} style={styles.googleIcon} />
        <Text style={styles.googleText}>Sign in with Google</Text>
      </TouchableOpacity>

      <Text style={styles.linkText} onPress={() => navigation.navigate('Signup')}>
        Don't have an account? Sign Up
      </Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, textAlign: 'center', marginBottom: 20, color:'black' },
  input: {
    height: 50,
    borderColor: '#000000',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  showButton: { marginLeft: 10 },
  showButtonText: { color: 'blue', fontWeight: 'bold' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3944bc',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 15,
  },
  googleIcon: { width: 24, height: 24, marginRight: 10 },
  googleText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: 'blue', textAlign: 'center', marginTop: 20 },
});


