import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PrivateRoute from './components/PrivateRoute';
import GameBoard from './components/GameBoard';
import Login from './components/Login';
import Register from './components/Register';
import Statistics from './components/Statistics';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import Profile from './components/Profile';
import { AuthProvider } from './context/AuthContext';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#CF7336' },
    secondary: { main: '#C14C34' },
    background: { default: '#0d0d1a', paper: '#1a1a2e' },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Открытые маршруты */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Главная страница — доступна всем (гостям и авторизованным) */}
            <Route path="/" element={<GameBoard />} />
            
            {/* Защищённые маршруты (только для авторизованных) */}
            <Route element={<PrivateRoute />}>
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* Админка (только для администраторов) */}
            <Route element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;