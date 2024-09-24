import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Login from './models/Login'
import Mappa from './models/Mappa'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/mappa" element={<Mappa />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
