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
import GrupoConvitesScreen from '../screens/Groups/GrupoConvitesScreen';
import GrupoDetalhesScreen from '../screens/Groups/GrupoDetalhesScreen';
import GrupoMembrosScreen from '../screens/Groups/GrupoMembrosScreen';
import GruposScreen from '../screens/Groups/GruposScreen';
import EditProfileScreen from '../screens/Settings/EditProfileScreen';
import { useTheme } from '../hooks/useTheme';
import { RootState } from '../store';
import { AppTabParamList, AuthStackParamList, GruposStackParamList, SettingsStackParamList } from '../types/navigation';

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
  const { theme } = useTheme();

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
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
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
  const { theme } = useTheme();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();

  // Tema personalizado para o Navigation Container
  const navigationTheme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: 'normal' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: 'bold' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
