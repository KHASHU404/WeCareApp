import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Image, 
  ScrollView 
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { auth } from '../firebase';
import { 
  updateProfile, 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProfileScreen = () => {
  const navigation = useNavigation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    name: '',
    email: '',
    providerId: '',
    photoURL: null,
  });

  // States for password change
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [mobileModalVisible, setMobileModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States for OTP flow (for Google users)
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // State for emergency contacts: up to three contacts.
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' },
  ]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const providerId = currentUser.providerData[0]?.providerId || '';
      setUser({
        name: currentUser.displayName || 'No Name',
        email: currentUser.email || 'No Email',
        providerId,
        photoURL: currentUser.photoURL,
      });
      
      // Fetch emergency contacts from Firestore
      const fetchContacts = async () => {
        try {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.emergencyContacts) {
              setEmergencyContacts(data.emergencyContacts);
            }
          }
        } catch (error) {
          console.error('Error fetching emergency contacts: ', error);
        }
      };
      fetchContacts();
    }
  }, []);

  // Handle profile saving (name, email)
  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await updateProfile(currentUser, { displayName: user.name });
      if (currentUser.email !== user.email) {
        await updateEmail(currentUser, user.email);
      }
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile: ', error);
      Alert.alert('Error', 'There was an issue updating your profile. ' + error.message);
    }
  };

  // Save emergency contacts to Firestore
  const handleSaveContacts = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, { emergencyContacts }, { merge: true });
      Alert.alert('Success', 'Emergency contacts saved successfully.');
    } catch (error) {
      console.error('Error saving contacts: ', error);
      Alert.alert('Error', 'Failed to save contacts. ' + error.message);
    }
  };

  // Firebase sign out with navigation reset
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Logout error: ', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  // Function to handle password change for email/password users
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordModalVisible(false);
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Reauthentication Required',
          'For security reasons, please sign in again before updating your password.',
          [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]
        );
      } else {
        console.error('Password change error: ', error);
        Alert.alert('Error', 'Failed to change password. ' + error.message);
      }
    }
  };

  // Dummy function to simulate sending OTP
  const sendOtp = async (mobile) => {
    setOtpSent(true);
    Alert.alert('OTP Sent', `An OTP has been sent to ${mobile}`);
  };

  // Dummy function to simulate OTP verification and then set password
  const handleSetPasswordAfterOtp = async () => {
    if (otp !== '123456') {
      Alert.alert('Error', 'Incorrect OTP.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await updatePassword(currentUser, newPassword);
      Alert.alert('Success', 'Password set successfully.');
      setMobileNumber('');
      setOtp('');
      setOtpSent(false);
      setNewPassword('');
      setConfirmPassword('');
      setMobileModalVisible(false);
    } catch (error) {
      console.error('Set password error: ', error);
      Alert.alert('Error', 'Failed to set password. ' + error.message);
    }
  };

  const renderPasswordModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={passwordModalVisible}
      onRequestClose={() => setPasswordModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Change Password</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Current Password"
            placeholderTextColor="grey"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="New Password"
            placeholderTextColor="grey"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Confirm New Password"
            placeholderTextColor="grey"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <View style={styles.modalButtonContainer}>
            <Button title="Submit" onPress={handleChangePassword} />
            <Button title="Cancel" onPress={() => setPasswordModalVisible(false)} />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMobileOtpModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={mobileModalVisible}
      onRequestClose={() => setMobileModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Set Password</Text>
          {!otpSent ? (
            <>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Mobile Number"
                placeholderTextColor="grey"
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
              <Button title="Send OTP" onPress={() => sendOtp(mobileNumber)} />
            </>
          ) : (
            <>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter OTP"
                placeholderTextColor="grey"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="New Password"
                placeholderTextColor="grey"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm New Password"
                placeholderTextColor="grey"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Button title="Submit" onPress={handleSetPasswordAfterOtp} />
            </>
          )}
          <Button title="Cancel" onPress={() => { setMobileModalVisible(false); setOtpSent(false); }} />
        </View>
      </View>
    </Modal>
  );

  const isGoogleUser = user.providerId === 'google.com';

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={100} color="#ccc" />
          )}
        </View>
        <Text style={styles.userName}>{user.name}</Text>
      </View>

      {/* User Details Card */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={22} color="#555" style={styles.infoIcon} />
          {isEditing ? (
            <TextInput
              style={styles.infoInput}
              value={user.email}
              onChangeText={(text) => setUser({ ...user, email: text })}
              keyboardType="email-address"
            />
          ) : (
            <Text style={styles.infoText}>{user.email}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={22} color="#555" style={styles.infoIcon} />
          {isEditing ? (
            <TextInput
              style={styles.infoInput}
              value={user.name}
              onChangeText={(text) => setUser({ ...user, name: text })}
            />
          ) : (
            <Text style={styles.infoText}>{user.name}</Text>
          )}
        </View>
      </View>

      {/* Emergency Contacts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        {emergencyContacts.map((contact, index) => (
          <View key={index} style={styles.contactRow}>
            <TextInput
              style={styles.contactInput}
              placeholder={`Contact ${index + 1} Name`}
              placeholderTextColor="grey"
              value={contact.name}
              onChangeText={(text) => {
                const newContacts = [...emergencyContacts];
                newContacts[index].name = text;
                setEmergencyContacts(newContacts);
              }}
            />
            <TextInput
              style={[styles.contactInput, styles.contactPhone]}
              placeholder="Phone"
              placeholderTextColor="grey"
              keyboardType="phone-pad"
              value={contact.phone}
              onChangeText={(text) => {
                const newContacts = [...emergencyContacts];
                newContacts[index].phone = text;
                setEmergencyContacts(newContacts);
              }}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.saveContactsButton} onPress={handleSaveContacts}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.buttonText}>Save Contacts</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {isEditing ? (
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={20} color="#fff" />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        {isGoogleUser ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setMobileModalVisible(true)}>
            <Ionicons name="key" size={20} color="#fff" />
            <Text style={styles.buttonText}>Set Password</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setPasswordModalVisible(true)}>
            <Ionicons name="key" size={20} color="#fff" />
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderPasswordModal()}
      {renderMobileOtpModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#f7f7f7',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImageContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
  },
  infoInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    color: '#333',
    marginRight: 10,
  },
  contactPhone: {
    flex: 0.7,
  },
  saveContactsButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    color: '#333',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default ProfileScreen;
