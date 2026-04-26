import { Tabs } from 'expo-router';
import { T } from '../../constants/theme';
import { FridgeIcon, CameraIcon, BellIcon } from '../../components/Icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.white,
          borderTopColor: T.border,
          borderTopWidth: 1,
          paddingBottom: 20,
          height: 70,
        },
        tabBarActiveTintColor: T.green700,
        tabBarInactiveTintColor: T.inkLight,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'DMSans_500Medium',
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Fridge',
          tabBarIcon: ({ color, size }) => <FridgeIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, size }) => <CameraIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ size }) => <BellIcon size={size} color={T.inkLight} />,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'DMSans_500Medium',
            letterSpacing: 0.1,
            color: T.inkLight,
          },
        }}
      />
    </Tabs>
  );
}
