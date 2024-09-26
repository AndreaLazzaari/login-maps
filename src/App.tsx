import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Login from './models/Login'
import Mappa from './models/Mappa'



function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Mappa />} />
          <Route path="/mappa" element={<Login />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
