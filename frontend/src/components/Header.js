import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Avatar } from '@mui/material';
import { Menu, Person } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <AppBar position="static" sx={{ bgcolor: '#0d0d1a' }}>
      <Toolbar>
        <IconButton color="inherit" onClick={onMenuClick}>
          <Menu sx={{ color: '#CF7336' }} />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, color: '#CF7336' }}>
          Арсенал TF2
        </Typography>
        {user && (
          <Box display="flex" alignItems="center">
            <Typography variant="body2" sx={{ mr: 1, color: '#fff' }}>
              {user.login}
            </Typography>
            <Avatar sx={{ bgcolor: '#CF7336', width: 32, height: 32 }}>
              <Person />
            </Avatar>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;