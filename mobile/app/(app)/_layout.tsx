import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'

export default function AppLayout() {
  const { t } = useTranslation()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#1F2937',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#00A3FF',
        tabBarInactiveTintColor: '#4B5563',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('header.goals'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎯</Text>,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t('header.achievements'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏆</Text>,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('header.stats'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📊</Text>,
        }}
      />
    </Tabs>
  )
}
