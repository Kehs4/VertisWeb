import { Route, Routes } from 'react-router-dom'
import Login from './pages/login/Login.jsx'
import Home from './pages/home/Home.jsx'
import NotFound from './pages/NotFound/NotFound.jsx';
import { useEffect } from 'react';
import Dashboard from './pages/Dashboard/Dashboard.jsx';

function AppRoutes() {

  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path="*" element={<NotFound/>} />
    </Routes>
  );
}

export default AppRoutes;