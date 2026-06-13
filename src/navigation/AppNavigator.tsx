import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TimelineScreen from '../screens/TimelineScreen';
import LogsScreen from '../screens/LogsScreen';
import SpamLogsScreen from '../screens/SpamLogsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import InsightsScreen from '../screens/InsightsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Timeline" component={TimelineScreen} options={{ tabBarIcon: ({color, size}) => <Icon name="timeline" size={size} color={color} /> }} />
    <Tab.Screen name="Insights" component={InsightsScreen} options={{ tabBarIcon: ({color, size}) => <Icon name="analytics" size={size} color={color} /> }} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={({ navigation }) => ({
          headerTitle: 'ArthaCore',
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15, padding: 5 }} onPress={() => navigation.navigate('Settings')}>
              <Image source={require('../assets/icons/SettingsIcon.png')} style={{width: 30, height: 30}} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="Logs" component={LogsScreen} options={{ title: 'SMS Logs' }} />
      <Stack.Screen name="SpamLogs" component={SpamLogsScreen} options={{ title: 'Spam SMS' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuration' }} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
