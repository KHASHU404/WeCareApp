
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
import { auth, firestore } from '../firebase'; // Import Firebase auth & Firestore
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin, statusCodes, } from '@react-native-google-signin/google-signin';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { NavigationProp } from '@react-navigation/native';

type Props = {
  navigation: NavigationProp<any>;
};

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '448337353788-1c1qoi6joh9g4unbfom48c34tu4djkg3.apps.googleusercontent.com', // Replace with your Web Client ID
      offlineAccess: true,
    });
  }, []);

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+{};:,<.>]).{8,}$/;
    return regex.test(password);
  };

  const handleSignup = async () => {
    if (!username.trim() || !dob.trim()) {
      Alert.alert('Validation Error', 'Please enter your username and date of birth.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.'
      );
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Store additional user data in Firestore
      await setDoc(doc(firestore, 'users', uid), {
        username,
        dob,
        email,
      });

      Alert.alert('Signup Successful', 'Your account has been created!');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const googleUser = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
  
      if (!idToken) {
        Alert.alert('Google Sign-In Failed', 'No ID token returned.');
        return;
      }
  
      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
  
      // Extract user details
      const { uid, email, displayName } = userCredential.user;
      const userDocRef = doc(firestore, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          username: displayName || 'User',
          email,
          dob: '',
        });
      }
  
      Alert.alert('Google Sign-In Success', `Welcome ${displayName || 'User'}!`);
      navigation.navigate('PhoneVerification', { uid });
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
  
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Google Sign-In Cancelled', 'User cancelled sign-in.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Google Sign-In In Progress', 'Please wait...');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Sign-In Error', 'Google Play Services not available.');
      } else {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {/* Manual Signup Inputs */}
      <TextInput
        style={styles.input}
        placeholderTextColor='grey'
        placeholder="Username"
        autoCapitalize="words"
        onChangeText={setUsername}
        value={username}
      />

      <TextInput
        style={styles.input}
        placeholderTextColor='grey'
        placeholder="Date of Birth (YYYY-MM-DD)"
        onChangeText={setDob}
        value={dob}
      />

      <TextInput
        style={styles.input}
        placeholderTextColor='grey'
        placeholder="Email"
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

      <Button title="Sign Up" onPress={handleSignup} />

      {/* Google Sign-In Button */}
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup}>
        <Image source={require('../assets/google.png')} style={styles.googleIcon} />
        <Text style={styles.googleText}>Sign in with Google</Text>
      </TouchableOpacity>

      <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>
        Already have an account? Login
      </Text>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, textAlign: 'center', marginBottom: 20, color: 'black' },
  input: {
    height: 50,
    borderColor: '#ccc',
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






