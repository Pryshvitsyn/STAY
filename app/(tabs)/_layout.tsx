import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: '#020711' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'STAY' }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
