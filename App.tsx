// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import HomeScreen from './components/HomeScreen';
import PhoneVerificationScreen from './components/PhoneVerificationScreen';


type RootStackParamList = {
  Signup: undefined;
  Login: undefined;
  PhoneVerification: { uid: string };
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();


const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} initialParams={{ uid: "" }}/>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
