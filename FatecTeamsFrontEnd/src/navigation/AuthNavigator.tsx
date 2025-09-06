import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, RegisterScreen, ForgotPasswordScreen } from '../screens';
import { AuthStackParamList } from '../types/navigation';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current, next, layouts }) => {
          const { width } = layouts.screen;
          
          const translateX = current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [width, 0],
          });

          const opacity = current.progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.25, 1],
          });

          return {
            cardStyle: {
              transform: [{ translateX }],
              opacity,
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'Entrar',
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          title: 'Criar Conta',
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{
          title: 'Recuperar Senha',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#6366f1',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
};
