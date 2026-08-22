import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
  Box, CircularProgress, Alert
} from '@mui/material';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';

const Leaderboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/stats/leaderboard/');
        setPlayers(response.data);
      } catch (err) {
        setError('Не удалось загрузить рейтинг');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#1a1a2e' }}>
          <Typography variant="h4" color="primary" component="h1" sx={{ mb: 3 }}>
            🏆 Рейтинг игроков
          </Typography>

          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                Топ-10 игроков по проценту побед (минимум 5 игр)
              </Typography>

              <TableContainer component={Paper} sx={{ bgcolor: '#0d0d1a' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>#</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>Игрок</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }} align="center">Игр</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }} align="center">Побед</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }} align="center">Процент побед</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }} align="center">Сред. попыток</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {players.map((player, index) => (
                      <TableRow key={index} sx={{ 
                        bgcolor: index === 0 ? '#2a1a0a' : 'transparent',
                        borderBottom: '1px solid #2a2a4a'
                      }}>
                        <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && `#${index + 1}`}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>{player.username}</TableCell>
                        <TableCell sx={{ color: '#fff' }} align="center">{player.total_games}</TableCell>
                        <TableCell sx={{ color: '#fff' }} align="center">{player.wins}</TableCell>
                        <TableCell sx={{ color: '#fff' }} align="center">
                          <Box component="span" sx={{
                            color: player.win_rate >= 70 ? '#4caf50' :
                                   player.win_rate >= 40 ? '#ff9800' : '#f44336',
                            fontWeight: 'bold'
                          }}>
                            {player.win_rate}%
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }} align="center">{player.avg_attempts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {players.length === 0 && (
                <Typography sx={{ color: '#aaa', textAlign: 'center', py: 4 }}>
                  Пока никто не играл. Стань первым! 🚀
                </Typography>
              )}
            </>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default Leaderboard;