import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Alert, Box, Checkbox, FormControlLabel } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreement: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.agreement) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (form.password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }

    setLoading(true);

    try {
      await register(form.username, form.email, form.password, form.agreement);
      navigate('/login');
    } catch (err) {
      setError('Ошибка регистрации. Возможно, такой пользователь уже существует.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, bgcolor: '#1a1a2e' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
          Регистрация
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Имя пользователя"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            margin="normal"
            required
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            margin="normal"
            required
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            margin="normal"
            required
            helperText="Минимум 8 символов"
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Подтверждение пароля"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            margin="normal"
            required
            sx={{ input: { color: '#fff' } }}
          />

          {/* Чекбокс согласия */}
          <FormControlLabel
            control={
              <Checkbox
                checked={form.agreement}
                onChange={(e) => setForm({ ...form, agreement: e.target.checked })}
                sx={{ color: '#aaa' }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Я согласен на обработку персональных данных в соответствии с{' '}
                <a
                  href="https://www.consultant.ru/document/cons_doc_LAW_61801/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#CF7336' }}
                >
                  152-ФЗ
                </a>
              </Typography>
            }
            sx={{ mt: 2, color: '#fff' }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            Зарегистрироваться
          </Button>
        </form>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;