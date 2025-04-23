import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { getApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { NavigationProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  PhoneVerification: { uid: string };
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "PhoneVerification">;

const PhoneVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const uid = route.params?.uid || "";

  const app = getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // Dummy verifier with _reset method
  const dummyAppVerifier = {
    type: 'recaptcha',
    verify: () => Promise.resolve('dummy-token'),
    _reset: () => {}  // No-op function to satisfy the expected interface
  };

  const sendOTP = async () => {
    try {
      // Provide the dummy verifier as the third argument
      const confirmation = await signInWithPhoneNumber(auth, phone, dummyAppVerifier);
      setVerificationId(confirmation.verificationId);
      Alert.alert('OTP Sent', 'Please enter the OTP to verify your phone number.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.log('Error', error.message,error.code);
    }
  };

  const verifyOTP = async () => {
    if (!verificationId) {
      Alert.alert('Error', 'Please request an OTP first.');
      return;
    }
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
      await updateDoc(doc(firestore, 'users', uid), { phone });
      Alert.alert('Verification Successful', 'Phone number verified successfully!');
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }]
      });
    } catch (error: any) {
      Alert.alert('OTP Verification Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Phone</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor='grey'
        placeholder="Phone Number"
        onChangeText={setPhone}
        value={phone}
      />
      <Button title="Send OTP" onPress={sendOTP} />
      {verificationId && (
        <>
          <TextInput
            style={styles.input}
            placeholderTextColor='grey'
            placeholder="Enter OTP"
            onChangeText={setOtp}
            value={otp}
          />
          <Button title="Verify OTP" onPress={verifyOTP} />
        </>
      )}
    </View>
  );
};

export default PhoneVerificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 20, color:'black' },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    color:'black'
  },
});
