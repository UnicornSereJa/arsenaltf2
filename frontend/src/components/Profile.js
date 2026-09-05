import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button,
  Box, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Checkbox, FormControlLabel
} from '@mui/material';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Данные профиля
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  
  // Смена пароля
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Удаление аккаунта
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [agreementChecked, setAgreementChecked] = useState(false);

  useEffect(() => {
    if (user) {
      setLogin(user.login || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/users/update_profile/', { login, email });
      setSuccess('Профиль обновлён успешно!');
      // Обновляем данные пользователя
      const response = await api.get('/users/me/');
      // В AuthContext нет прямого обновления, можно просто перезагрузить
      window.location.reload();
    } catch (err) {
      setError('Ошибка обновления профиля');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/users/change_password/', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setSuccess('Пароль изменён успешно!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Неверный старый пароль или ошибка');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.login) {
      setError('Введите логин для подтверждения');
      return;
    }
    if (!agreementChecked) {
      setError('Подтвердите согласие на удаление');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/users/delete_account/');
      logout();
      navigate('/login');
    } catch (err) {
      setError('Ошибка удаления аккаунта');
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  if (!user) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Alert severity="warning">Пожалуйста, войдите в систему</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#1a1a2e' }}>
          <Typography variant="h4" color="primary" component="h1" sx={{ mb: 3 }}>
            👤 Профиль
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

          {/* Редактирование профиля */}
          <Typography variant="h6" color="#fff" sx={{ mt: 3, mb: 2 }}>
            Основные данные
          </Typography>
          <TextField
            fullWidth
            label="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            margin="normal"
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            sx={{ input: { color: '#fff' } }}
          />
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Сохранить изменения
          </Button>

          {/* Смена пароля */}
          <Typography variant="h6" color="#fff" sx={{ mt: 4, mb: 2 }}>
            Смена пароля
          </Typography>
          <TextField
            fullWidth
            label="Старый пароль"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            margin="normal"
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Новый пароль"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Подтверждение пароля"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            sx={{ input: { color: '#fff' } }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleChangePassword}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Сменить пароль
          </Button>

          {/* Удаление аккаунта */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #2a2a4a' }}>
            <Typography variant="h6" color="#f44336" sx={{ mb: 2 }}>
              ⚠️ Опасная зона
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Удалить аккаунт
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Диалог удаления аккаунта */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ bgcolor: '#1a1a2e', color: '#f44336' }}>
          ⚠️ Удаление аккаунта
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a2e' }}>
          <Typography sx={{ color: '#fff', mb: 2 }}>
            Вы уверены, что хотите удалить свой аккаунт? Это действие <b>необратимо</b>.
          </Typography>
          <Typography sx={{ color: '#aaa', mb: 2 }}>
            Введите свой логин <b>{user.login}</b> для подтверждения:
          </Typography>
          <TextField
            fullWidth
            label="Логин"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            sx={{ input: { color: '#fff' }, mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                sx={{ color: '#aaa' }}
              />
            }
            label="Я подтверждаю удаление всех моих данных"
            sx={{ color: '#fff' }}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a2e' }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Profile;