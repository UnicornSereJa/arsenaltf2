import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Alert, Snackbar
} from '@mui/material';
import api from '../api/axios';

const GameBoard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [remaining, setRemaining] = useState(6);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
        
        // Если игра завершена и пользователь не авторизован — предложить войти
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, bgcolor: '#1a1a2e' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" color="primary" component="h1">
            Арсенал TF2
          </Typography>
          <Button
            variant="contained"
            onClick={startNewGame}
            disabled={loading}
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

        {/* Предложение войти после игры */}
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
                <TableCell sx={{ color: '#fff' }}>Класс</TableCell>
                <TableCell sx={{ color: '#fff' }}>Слот</TableCell>
                <TableCell sx={{ color: '#fff' }}>Магазин</TableCell>
                <TableCell sx={{ color: '#fff' }}>Перезарядка</TableCell>
                <TableCell sx={{ color: '#fff' }}>Год</TableCell>
                <TableCell sx={{ color: '#fff' }}>Создатель</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell sx={{ color: '#fff' }}>{attempt.attempt_no}</TableCell>
                  <TableCell sx={{ bgcolor: getColor(attempt.comparison_result.class.match), color: '#fff', fontWeight: 'bold' }}>
                    {attempt.comparison_result.class.guessed.join(', ')}
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            label="Введите название оружия"
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
            disabled={gameOver || loading}
            sx={{ bgcolor: '#0d0d1a', input: { color: '#fff' } }}
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
  );
};

export default GameBoard;