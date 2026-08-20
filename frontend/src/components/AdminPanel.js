import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, CircularProgress,
  IconButton, Chip, Switch, FormControlLabel
} from '@mui/material';
import { Delete, Edit, Block, CheckCircle } from '@mui/icons-material';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';

const AdminPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Диалоги
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editWeaponOpen, setEditWeaponOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchWeapons();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err) {
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeapons = async () => {
    try {
      const response = await api.get('/weapons/');
      setWeapons(response.data);
    } catch (err) {
      setError('Ошибка загрузки оружия');
    }
  };

  const handleToggleBlock = async (user) => {
    try {
      await api.patch(`/users/${user.id}/`, { is_blocked: !user.is_blocked });
      setSuccess(`Пользователь ${user.login} ${user.is_blocked ? 'разблокирован' : 'заблокирован'}`);
      fetchUsers();
    } catch (err) {
      setError('Ошибка изменения статуса');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await api.delete(`/users/${userId}/`);
      setSuccess('Пользователь удалён');
      fetchUsers();
    } catch (err) {
      setError('Ошибка удаления');
    }
  };

  const handleEditWeapon = async () => {
    try {
      await api.put(`/weapons/${selectedItem.id}/`, {
        name: editForm.name,
        year_released: parseInt(editForm.year_released),
        magazine_size: editForm.magazine_size ? parseInt(editForm.magazine_size) : null,
      });
      setSuccess('Оружие обновлено');
      setEditWeaponOpen(false);
      fetchWeapons();
    } catch (err) {
      setError('Ошибка обновления');
    }
  };

  const handleToggleWeaponDelete = async (weapon) => {
    try {
      await api.patch(`/weapons/${weapon.id}/`, { is_deleted: !weapon.is_deleted });
      setSuccess(`Оружие ${weapon.is_deleted ? 'восстановлено' : 'удалено'}`);
      fetchWeapons();
    } catch (err) {
      setError('Ошибка изменения статуса');
    }
  };

  const openEditWeapon = (weapon) => {
    setSelectedItem(weapon);
    setEditForm({
      name: weapon.name,
      year_released: weapon.year_released,
      magazine_size: weapon.magazine_size || '',
    });
    setEditWeaponOpen(true);
  };

  return (
    <>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#1a1a2e' }}>
          <Typography variant="h4" color="primary" component="h1" sx={{ mb: 3 }}>
            ⚙️ Админ-панель
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #2a2a4a' }}>
            <Tab label="Пользователи" sx={{ color: '#fff' }} />
            <Tab label="Оружие" sx={{ color: '#fff' }} />
          </Tabs>

          {/* ========== ПОЛЬЗОВАТЕЛИ ========== */}
          {tab === 0 && (
            <Box>
              <Typography variant="h6" color="#fff" sx={{ mb: 2 }}>
                Управление пользователями
              </Typography>
              <TableContainer component={Paper} sx={{ bgcolor: '#0d0d1a' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#aaa' }}>ID</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Логин</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Email</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Статус</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} sx={{ borderBottom: '1px solid #2a2a4a' }}>
                        <TableCell sx={{ color: '#fff' }}>{user.id}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{user.login}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_blocked ? 'Заблокирован' : 'Активен'}
                            size="small"
                            sx={{
                              bgcolor: user.is_blocked ? '#f44336' : '#4caf50',
                              color: '#fff'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleToggleBlock(user)}
                            color={user.is_blocked ? 'success' : 'warning'}
                            title={user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                          >
                            {user.is_blocked ? <CheckCircle /> : <Block />}
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteUser(user.id)}
                            color="error"
                            title="Удалить"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ========== ОРУЖИЕ ========== */}
          {tab === 1 && (
            <Box>
              <Typography variant="h6" color="#fff" sx={{ mb: 2 }}>
                Управление оружием
              </Typography>
              <TableContainer component={Paper} sx={{ bgcolor: '#0d0d1a' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#aaa' }}>ID</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Название</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Год</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Магазин</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Статус</TableCell>
                      <TableCell sx={{ color: '#aaa' }}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {weapons.map((weapon) => (
                      <TableRow key={weapon.id} sx={{ borderBottom: '1px solid #2a2a4a' }}>
                        <TableCell sx={{ color: '#fff' }}>{weapon.id}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{weapon.name_ru || weapon.name}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{weapon.year_released}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{weapon.magazine_size || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={weapon.is_deleted ? 'Удалено' : 'Активно'}
                            size="small"
                            sx={{
                              bgcolor: weapon.is_deleted ? '#f44336' : '#4caf50',
                              color: '#fff'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => openEditWeapon(weapon)}
                            color="primary"
                            title="Редактировать"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => handleToggleWeaponDelete(weapon)}
                            color={weapon.is_deleted ? 'success' : 'error'}
                            title={weapon.is_deleted ? 'Восстановить' : 'Удалить'}
                          >
                            {weapon.is_deleted ? <CheckCircle /> : <Delete />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      </Container>

      {/* ========== ДИАЛОГ РЕДАКТИРОВАНИЯ ОРУЖИЯ ========== */}
      <Dialog open={editWeaponOpen} onClose={() => setEditWeaponOpen(false)}>
        <DialogTitle sx={{ bgcolor: '#1a1a2e', color: '#fff' }}>Редактировать оружие</DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a2e' }}>
          <TextField
            fullWidth
            label="Название"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            margin="normal"
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Год выпуска"
            type="number"
            value={editForm.year_released || ''}
            onChange={(e) => setEditForm({ ...editForm, year_released: e.target.value })}
            margin="normal"
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Патронов в обойме"
            type="number"
            value={editForm.magazine_size || ''}
            onChange={(e) => setEditForm({ ...editForm, magazine_size: e.target.value })}
            margin="normal"
            sx={{ input: { color: '#fff' } }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a2e' }}>
          <Button onClick={() => setEditWeaponOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleEditWeapon}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminPanel;