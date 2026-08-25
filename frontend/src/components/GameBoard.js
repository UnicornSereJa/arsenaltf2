import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Alert, Snackbar, Autocomplete
} from '@mui/material';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';

const CLASS_NAMES = {
  'SCOUT': 'Разведчик',
  'SOLDIER': 'Солдат',
  'PYRO': 'Поджигатель',
  'DEMO': 'Подрывник',
  'HEAVY': 'Пулемётчик',
  'ENGINEER': 'Инженер',
  'MEDIC': 'Медик',
  'SNIPER': 'Снайпер',
  'SPY': 'Шпион'
};

const GameBoard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [remaining, setRemaining] = useState(6);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const [weaponOptions, setWeaponOptions] = useState([]);

  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        const response = await api.get('/weapons/');
        setWeaponOptions(response.data);
      } catch (err) {
        console.error('Ошибка загрузки списка оружий:', err);
      }
    };
    fetchWeapons();
  }, []);

  const startNewGame = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/sessions/start/');
      setSession(response.data);
      setAttempts([]);
      setRemaining(response.data.max_attempts);
      setGameOver(false);
      setResult(null);
      setInput('');
      setShowLoginPrompt(false);
    } catch (err) {
      console.error('Ошибка старта игры:', err);
      setError('Не удалось начать игру');
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!input.trim()) return;
    if (!session) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/sessions/${session.id}/guess/`, {
        weapon_name: input.trim()
      });

      const data = response.data;
      setAttempts(prev => [data.attempt, ...prev]);
      setRemaining(data.remaining_attempts);

      if (data.game_over) {
        setGameOver(true);
        setResult(data.result);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          setShowLoginPrompt(true);
        }
      }
      setInput('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Оружие не найдено. Попробуйте ещё раз.');
      } else {
        console.error('Ошибка догадки:', err);
        setError('Произошла ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleClosePrompt = () => {
    setShowLoginPrompt(false);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const getColor = (match) => {
    switch (match) {
      case 'exact': return '#2e7d32';
      case 'partial': return '#f9a825';
      default: return '#c62828';
    }
  };

  const getYearDisplay = (comparison) => {
    if (comparison.match === 'exact') {
      return `${comparison.target}`;
    }
    return `${comparison.guessed} ${comparison.direction === 'up' ? '↑' : '↓'}`;
  };

  const getWeaponImage = (attempt) => {
    const guessedWeapon = attempt.guessed_weapon;
    return guessedWeapon?.image_url || null;
  };

  const getClassNames = (classData) => {
    console.log('🔍 Все попытки:', attempts);
    if (!classData) return '—';
    
    if (Array.isArray(classData)) {
      if (classData.length === 0) return '—';
      if (typeof classData[0] === 'object') {
        return classData.map(item => item.name_ru || item.name || item).join(', ');
      }
      return classData.map(code => CLASS_NAMES[code] || code).join(', ');
    }
    
    if (typeof classData === 'string') {
      return CLASS_NAMES[classData] || classData;
    }
    
    if (typeof classData === 'object') {
      if (classData.name_ru) return classData.name_ru;
      if (classData.name) return classData.name;
      const values = Object.values(classData);
      return values.map(v => {
        if (typeof v === 'string') return CLASS_NAMES[v] || v;
        if (v?.name_ru) return v.name_ru;
        if (v?.name) return v.name;
        return v;
      }).join(', ');
    }
    
    return '—';
  };

  return (
    <>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#1a1a2e' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            {/* Большой логотип вместо заголовка */}
            <Box display="flex" justifyContent="center" flex={1}>
              <img 
                src="/images/arsenal_logo_big1.png" 
                alt="Арсенал TF2" 
                style={{ 
                  width: '100%', 
                  maxWidth: '150px', 
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />
            </Box>
            <Button
              variant="contained"
              onClick={startNewGame}
              disabled={loading}
              sx={{ ml: 2 }}
            >
              Новая игра
            </Button>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Осталось попыток: {remaining}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {gameOver && (
            <Alert severity={result === 'win' ? 'success' : 'error'} sx={{ mb: 2 }}>
              {result === 'win' ? '🎉 Поздравляем! Вы угадали!' : '😔 Попытки закончились. Загадано: ' + (session?.weapon_name || '')}
            </Alert>
          )}

          <Snackbar
            open={showLoginPrompt}
            autoHideDuration={6000}
            onClose={handleClosePrompt}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              severity="info" 
              onClose={handleClosePrompt}
              action={
                <Button color="inherit" size="small" onClick={handleLoginRedirect}>
                  Войти
                </Button>
              }
            >
              Хотите сохранить результат? Войдите в систему!
            </Alert>
          </Snackbar>

          <TableContainer component={Paper} sx={{ bgcolor: '#0d0d1a', mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#fff' }}>#</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Картинка</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Класс</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Слот</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Магазин</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Перезарядка</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Год</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Создатель</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attempts.map((attempt) => {
                  const imageUrl = getWeaponImage(attempt);
                  return (
                    <TableRow key={attempt.id}>
                      <TableCell sx={{ color: '#fff' }}>{attempt.attempt_no}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={attempt.guessed_weapon?.name_ru || attempt.input_text}
                            style={{ width: '60px', height: 'auto', borderRadius: '4px' }}
                          />
                        ) : (
                          <span style={{ color: '#555' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell sx={{ bgcolor: getColor(attempt.comparison_result.class.match), color: '#fff', fontWeight: 'bold' }}>
                        {getClassNames(attempt.comparison_result.class.guessed)}
                      </TableCell>
                      <TableCell sx={{ bgcolor: getColor(attempt.comparison_result.slot.match), color: '#fff', fontWeight: 'bold' }}>
                        {attempt.comparison_result.slot.guessed}
                      </TableCell>
                      <TableCell sx={{ bgcolor: getColor(attempt.comparison_result.magazine.match), color: '#fff', fontWeight: 'bold' }}>
                        {attempt.comparison_result.magazine.guessed ?? '—'}
                      </TableCell>
                      <TableCell sx={{ bgcolor: getColor(attempt.comparison_result.reload.match), color: '#fff', fontWeight: 'bold' }}>
                        {attempt.comparison_result.reload.guessed}
                      </TableCell>
                      <TableCell sx={{ bgcolor: getColor(attempt.comparison_result.year.match), color: '#fff', fontWeight: 'bold' }}>
                        {getYearDisplay(attempt.comparison_result.year)}
                      </TableCell>
                      <TableCell sx={{ bgcolor: getColor(attempt.comparison_result.creator.match), color: '#fff', fontWeight: 'bold' }}>
                        {attempt.comparison_result.creator.guessed}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" gap={2}>
            <Autocomplete
              freeSolo
              fullWidth
              options={weaponOptions}
              getOptionLabel={(option) => option.name_ru || option.name}
              isOptionEqualToValue={(option, value) => option.name === value.name}
              inputValue={input}
              onInputChange={(event, newValue) => setInput(newValue)}
              onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
              disabled={gameOver || loading}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {option.image_url && (
                    <img 
                      src={option.image_url} 
                      alt={option.name_ru || option.name}
                      style={{ width: '30px', height: 'auto', borderRadius: '2px' }}
                    />
                  )}
                  <span>{option.name_ru || option.name}</span>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Введите название оружия"
                  variant="outlined"
                  disabled={gameOver || loading}
                  sx={{ bgcolor: '#0d0d1a', input: { color: '#fff' } }}
                />
              )}
              ListboxProps={{
                style: {
                  backgroundColor: '#1a1a2e',
                  color: '#fff'
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleGuess}
              disabled={gameOver || loading || !input.trim()}
            >
              Отправить
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default GameBoard;