import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Admin from './components/Admin';
import Form from './components/Form';
import Verify from './components/verify/Verify';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/form" element={<Form />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </Router>
  )
}

export default App
