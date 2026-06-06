import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import PetCreator from './pages/PetCreator'
import PetList from './pages/PetList'
import PetDetail from './pages/PetDetail'
import Chat from './pages/Chat'
import Settings from './pages/Settings'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<PetCreator />} />
          <Route path="pets" element={<PetList />} />
          <Route path="pets/:id" element={<PetDetail />} />
          <Route path="chat/:petId?" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
