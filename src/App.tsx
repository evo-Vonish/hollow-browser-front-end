import { Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import Results from '@/pages/Results'
import Reader from '@/pages/Reader'

export default function App() {
  return (
    <div className="min-h-screen bg-bg-0 text-ink-0">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/read" element={<Reader />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  )
}
