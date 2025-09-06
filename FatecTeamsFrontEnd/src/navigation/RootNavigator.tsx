import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSelector } from 'react-redux';
import {
    ForgotPasswordScreen,
    HomeScreen,
    LoginScreen,
    RegisterScreen,
    SettingsScreen,
} from '../screens';
import AccountDeactivatedScreen from '../screens/Auth/AccountDeactivatedScreen';
import EditProfileScreen from '../screens/Settings/EditProfileScreen';
import GruposScreen from '../screens/Groups/GruposScreen';
import GrupoDetalhesScreen from '../screens/Groups/GrupoDetalhesScreen';
import GrupoMembrosScreen from '../screens/Groups/GrupoMembrosScreen';
import GrupoConvitesScreen from '../screens/Groups/GrupoConvitesScreen';
import { RootState } from '../store';
import { AppStackParamList, AppTabParamList, AuthStackParamList, SettingsStackParamList, GruposStackParamList } from '../types/navigation';

const AuthStack = createStackNavigator<AuthStackParamList>();
const AppTab = createBottomTabNavigator<AppTabParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const GruposStack = createStackNavigator<GruposStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="Login"
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="AccountDeactivated" component={AccountDeactivatedScreen} />
    </AuthStack.Navigator>
  );
};

const SettingsNavigator: React.FC = () => {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="EditProfile" component={EditProfileScreen} />
    </SettingsStack.Navigator>
  );
};

const GruposNavigator: React.FC = () => {
  return (
    <GruposStack.Navigator screenOptions={{ headerShown: false }}>
      <GruposStack.Screen name="GruposMain" component={GruposScreen} />
      <GruposStack.Screen name="GrupoDetalhes" component={GrupoDetalhesScreen} />
      <GruposStack.Screen name="GrupoMembros" component={GrupoMembrosScreen} />
      <GruposStack.Screen name="GrupoConvites" component={GrupoConvitesScreen} />
    </GruposStack.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <AppTab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Grupos') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingTop: 5,
          paddingBottom: 5,
        },
      })}
      initialRouteName="Home"
    >
      <AppTab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Início',
        }}
      />
      <AppTab.Screen 
        name="Grupos" 
        component={GruposNavigator} 
        options={{
          tabBarLabel: 'Grupos',
        }}
      />
      <AppTab.Screen 
        name="Settings" 
        component={SettingsNavigator} 
        options={{
          tabBarLabel: 'Configurações',
        }}
      />
    </AppTab.Navigator>
  );
};

const LoadingScreen: React.FC = () => {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1E88E5', // Cor primária do tema
    }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
