import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Login from './models/Login'
import Mappa from './models/Mappa'
import MyNavbar from './models/MyNavbar'


function App() {

  return (
    <>
      <Router>
        <MyNavbar></MyNavbar>
        <Routes>
          <Route path="/" element={<Mappa />} />
          <Route path="/mappa" element={<Mappa />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
