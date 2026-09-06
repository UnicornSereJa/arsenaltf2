import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Drawer, List, ListItem, ListItemIcon, ListItemText, 
  Divider, Box, Typography, Avatar, Button 
} from '@mui/material';
import {
  Home, BarChart, Leaderboard, AdminPanelSettings,
  Person, Logout, Settings
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 250, p: 2, bgcolor: '#1a1a2e', height: '100%' }}>
        {/* Логотип в сайдбаре */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img 
            src="/images/arsenal_logo.png" 
            alt="Арсенал TF2" 
            style={{ 
              width: '100%', 
              maxWidth: '200px', 
              height: 'auto',
              borderRadius: '4px'
            }}
          />
        </Box>

        <Divider sx={{ bgcolor: '#2a2a4a' }} />

        <List>
          <ListItem button component={Link} to="/" onClick={onClose}>
            <ListItemIcon><Home sx={{ color: '#CF7336' }} /></ListItemIcon>
            <ListItemText primary="Играть" sx={{ color: '#fff' }} />
          </ListItem>

          <ListItem button component={Link} to="/statistics" onClick={onClose}>
            <ListItemIcon><BarChart sx={{ color: '#CF7336' }} /></ListItemIcon>
            <ListItemText primary="Статистика" sx={{ color: '#fff' }} />
          </ListItem>

          <ListItem button component={Link} to="/leaderboard" onClick={onClose}>
            <ListItemIcon><Leaderboard sx={{ color: '#CF7336' }} /></ListItemIcon>
            <ListItemText primary="Рейтинг" sx={{ color: '#fff' }} />
          </ListItem>
        </List>

        <Divider sx={{ bgcolor: '#2a2a4a' }} />

        {user && (
          <List>
            <ListItem button component={Link} to="/profile" onClick={onClose}>
              <ListItemIcon><Person sx={{ color: '#CF7336' }} /></ListItemIcon>
              <ListItemText primary={user.login} sx={{ color: '#fff' }} />
            </ListItem>
            {user.is_staff && (
              <ListItem button component={Link} to="/admin" onClick={onClose}>
                <ListItemIcon><AdminPanelSettings sx={{ color: '#CF7336' }} /></ListItemIcon>
                <ListItemText primary="Админка" sx={{ color: '#fff' }} />
              </ListItem>
            )}
          </List>
        )}

        <Divider sx={{ bgcolor: '#2a2a4a' }} />

        <Box sx={{ mt: 'auto', pt: 2 }}>
          {user ? (
            <Button 
              fullWidth 
              variant="contained" 
              color="secondary" 
              onClick={handleLogout}
              startIcon={<Logout />}
            >
              Выйти
            </Button>
          ) : (
            <Button 
              fullWidth 
              variant="contained" 
              component={Link} 
              to="/login"
              sx={{ bgcolor: '#CF7336' }}
            >
              Войти
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;