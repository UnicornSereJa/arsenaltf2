import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid,
  Card, CardContent, LinearProgress, Table,
  TableBody, TableCell, TableContainer, TableHead,
  TableRow, Alert, CircularProgress
} from '@mui/material';
import {
  EmojiEvents, TrendingDown
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';

const Statistics = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.get('/stats/my_stats/');
        setStats(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Не удалось загрузить статистику');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const getPieData = () => {
    if (!stats) return [];
    return [
      { name: 'Победы', value: stats.wins || 0 },
      { name: 'Поражения', value: stats.losses || 0 },
    ];
  };

  const getAttemptsData = () => {
    if (!stats || !stats.last_games) return [];
    return stats.last_games.map((game, index) => ({
      name: `#${index + 1}`,
      Попытки: game.attempts_used,
      Результат: game.result === 'win' ? 'Победа' : 'Поражение',
    })).reverse();
  };

  const COLORS = ['#4caf50', '#f44336'];
  const PIE_COLORS = ['#4caf50', '#f44336'];

  const getResultIcon = (result) => {
    if (result === 'win') {
      return <EmojiEvents sx={{ color: '#4caf50', fontSize: 20 }} />;
    }
    return <TrendingDown sx={{ color: '#f44336', fontSize: 20 }} />;
  };

  const getResultColor = (result) => {
    return result === 'win' ? '#4caf50' : '#f44336';
  };

  if (loading) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="info">Пока нет данных. Сыграйте несколько игр!</Alert>
        </Container>
      </>
    );
  }

  const { total_games, wins, losses, win_rate, avg_attempts, last_games } = stats;
  const pieData = getPieData();
  const attemptsData = getAttemptsData();

  return (
    <>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#1a1a2e' }}>
          {/* Логотип на странице статистики */}
          <Box display="flex" justifyContent="center" mb={3}>
            <img 
              src="/images/arsenal_logo_big1.png" 
              alt="Арсенал TF2" 
              style={{ 
                width: '100%', 
                maxWidth: '400px', 
                height: 'auto',
                borderRadius: '8px'
              }}
            />
          </Box>

          {/* Карточки с цифрами */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#0d0d1a', border: '1px solid #2a2a4a' }}>
                <CardContent>
                  <Typography variant="body2" color="#aaa">Всего игр</Typography>
                  <Typography variant="h4" color="#fff">{total_games}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#0d0d1a', border: '1px solid #2a2a4a' }}>
                <CardContent>
                  <Typography variant="body2" color="#aaa">Победы</Typography>
                  <Typography variant="h4" color="#4caf50">{wins}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#0d0d1a', border: '1px solid #2a2a4a' }}>
                <CardContent>
                  <Typography variant="body2" color="#aaa">Поражения</Typography>
                  <Typography variant="h4" color="#f44336">{losses}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#0d0d1a', border: '1px solid #2a2a4a' }}>
                <CardContent>
                  <Typography variant="body2" color="#aaa">Сред. попыток</Typography>
                  <Typography variant="h4" color="#fff">{avg_attempts}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Графики */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: '#0d0d1a' }}>
                <Typography variant="h6" color="#fff" sx={{ mb: 2, textAlign: 'center' }}>
                  Соотношение побед и поражений
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: '#0d0d1a' }}>
                <Typography variant="h6" color="#fff" sx={{ mb: 2, textAlign: 'center' }}>
                  Попытки в последних играх
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={attemptsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                    <XAxis dataKey="name" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip />
                    <Bar dataKey="Попытки" fill="#CF7336">
                      {attemptsData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.Результат === 'Победа' ? '#4caf50' : '#f44336'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Процент побед */}
          <Paper sx={{ p: 2, bgcolor: '#0d0d1a', mb: 3 }}>
            <Typography variant="body2" color="#aaa" sx={{ mb: 1 }}>
              Процент побед: {win_rate}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={win_rate}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: '#2a2a4a',
                '& .MuiLinearProgress-bar': {
                  bgcolor: win_rate >= 70 ? '#4caf50' :
                           win_rate >= 40 ? '#ff9800' : '#f44336'
                }
              }}
            />
          </Paper>

          {/* История игр */}
          <Typography variant="h5" color="#fff" sx={{ mb: 2 }}>
            📜 История игр
          </Typography>

          {last_games && last_games.length > 0 ? (
            <TableContainer component={Paper} sx={{ bgcolor: '#0d0d1a' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#aaa' }}>Дата</TableCell>
                    <TableCell sx={{ color: '#aaa' }}>Оружие</TableCell>
                    <TableCell sx={{ color: '#aaa' }} align="center">Попытки</TableCell>
                    <TableCell sx={{ color: '#aaa' }} align="center">Результат</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {last_games.map((game) => (
                    <TableRow key={game.id} sx={{ borderBottom: '1px solid #2a2a4a' }}>
                      <TableCell sx={{ color: '#fff' }}>
                        {new Date(game.finished_at).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {game.weapon__name_ru}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }} align="center">
                        {game.attempts_used}
                      </TableCell>
                      <TableCell sx={{ color: getResultColor(game.result) }} align="center">
                        {getResultIcon(game.result)} {game.result === 'win' ? 'Победа' : 'Поражение'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: '#aaa', textAlign: 'center', py: 4 }}>
              Пока нет завершённых игр. Сыграйте несколько партий! 🎯
            </Typography>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default Statistics;