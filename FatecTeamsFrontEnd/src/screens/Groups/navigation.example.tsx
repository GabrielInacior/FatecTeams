// Exemplo de como integrar as telas de grupos na navegação
// Este arquivo serve como referência para implementação

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  GruposScreen, 
  GrupoDetalhesScreen, 
  GrupoMembrosScreen, 
  GrupoConvitesScreen 
} from './index';

const Stack = createStackNavigator();

// Stack Navigator para as telas de grupos
export const GruposStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Headers customizados nas telas
      }}
    >
      <Stack.Screen 
        name="GruposMain" 
        component={GruposScreen} 
      />
      <Stack.Screen 
        name="GrupoDetalhes" 
        component={GrupoDetalhesScreen} 
      />
      <Stack.Screen 
        name="GrupoMembros" 
        component={GrupoMembrosScreen} 
      />
      <Stack.Screen 
        name="GrupoConvites" 
        component={GrupoConvitesScreen} 
      />
    </Stack.Navigator>
  );
};

// Exemplo de integração no Tab Navigator principal
/*
export const MainTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Grupos" component={GruposStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
*/

// Tipos para navegação TypeScript
export type GruposStackParamList = {
  GruposMain: undefined;
  GrupoDetalhes: {
    grupoId: string;
    grupo: any;
  };
  GrupoMembros: {
    grupoId: string;
    grupo: any;
    membros?: any[];
  };
  GrupoConvites: {
    grupoId: string;
    grupo: any;
  };
};
