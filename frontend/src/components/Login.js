import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Alert, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(login, password);
      navigate('/');
    } catch (err) {
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, bgcolor: '#1a1a2e' }}>
        {/* Логотип на странице входа */}
        <Box display="flex" justifyContent="center" mb={2}>
          <img 
            src="/images/arsenal_logo_big1.png" 
            alt="Арсенал TF2" 
            style={{ 
              width: '100%', 
              maxWidth: '350px', 
              height: 'auto',
              borderRadius: '8px'
            }}
          />
        </Box>

        <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
          Вход в систему
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Логин"
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            margin="normal"
            required
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            sx={{ input: { color: '#fff' } }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            Войти
          </Button>
        </form>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;