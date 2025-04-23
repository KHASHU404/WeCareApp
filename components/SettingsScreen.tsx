import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Optionally, clear stored data
      await AsyncStorage.removeItem('userData');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      Alert.alert('Logout Error', 'Unable to log out. Please try again.');
    }
  };

  const renderItem = (iconName: string, title: string, navigateTo: string) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate(navigateTo)}
    >
      <MaterialIcons name={iconName} size={24} color="#4F8EF7" />
      <Text style={styles.itemText}>{title}</Text>
      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.header}>Settings</Text>

      {/* Account Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        {renderItem('email', 'Update Email', 'UpdateEmail')}
        {renderItem('lock', 'Change Password', 'ChangePassword')}
        {renderItem('phone', 'Change Phone Number', 'ChangePhone')}
      </View>

      {/* Privacy & Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        {renderItem('contacts', 'Emergency Contacts', 'ManageEmergencyContacts')}
        {renderItem('security', 'App Permissions', 'AppPermissions')}
      </View>

      {/* App Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        {renderItem('language', 'Language', 'LanguageSelection')}
        {renderItem('brightness-6', 'Dark/Light Mode', 'ThemeSelection')}
        {renderItem('notifications', 'Notification Preferences', 'NotificationSettings')}
      </View>

      {/* About & Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About & Support</Text>
        {renderItem('info', 'About the App', 'AboutApp')}
        {renderItem('support-agent', 'Contact Support', 'ContactSupport')}
        {renderItem('policy', 'Terms & Privacy Policy', 'TermsPrivacy')}
      </View>

      {/* Logout Section */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#444',
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  itemText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  logoutContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#E53935',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default SettingsScreen;
