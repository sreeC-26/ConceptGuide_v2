import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HistoryPage from './pages/HistoryPage'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  const syncSessionsFromFirebase = useAppStore((state) => state.syncSessionsFromFirebase)
  const user = useAuthStore((state) => state.user)


  useEffect(() => {
    if (user?.uid) {
      syncSessionsFromFirebase()
    }
  }, [user?.uid, syncSessionsFromFirebase])

  return (
    <Routes>
      <Route path="/" element={<Layout />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
    </Routes>
  )
}

export default App
