import React from 'react';
import {
  Box, Container, Typography, Link, Grid,
  Divider, IconButton
} from '@mui/material';
import { GitHub, Mail, Info } from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#0d0d1a',
        color: '#aaa',
        py: 4,
        mt: 'auto',
        borderTop: '1px solid #2a2a4a'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Левая колонка — информация о проекте с логотипом */}
          <Grid item xs={12} md={4}>
            <img 
              src="/images/arsenal_logo.png" 
              alt="Арсенал TF2" 
              style={{ 
                width: '150px', 
                height: 'auto',
                marginBottom: '8px'
              }}
            />
            <Typography variant="body2" sx={{ color: '#888', mt: 1 }}>
              Игра-головоломка по мотивам Team Fortress 2.
              Угадай оружие по характеристикам за 6 попыток!
            </Typography>
          </Grid>

          {/* Центральная колонка — ссылки */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1 }}>
              Навигация
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Link href="/" color="inherit" underline="hover">Играть</Link>
              <Link href="/statistics" color="inherit" underline="hover">Статистика</Link>
              <Link href="/leaderboard" color="inherit" underline="hover">Рейтинг</Link>
            </Box>
          </Grid>

          {/* Правая колонка — юр. информация */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1 }}>
              Правовая информация
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem' }}>
              Все изображения оружия и логотипы являются собственностью{' '}
              <Link
                href="https://www.valvesoftware.com/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#CF7336' }}
              >
                Valve Corporation
              </Link>
              . Используются в ознакомительных и некоммерческих целях.
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', fontSize: '0.7rem', mt: 1 }}>
              © {currentYear} Арсенал TF2. Неофициальный фанатский проект.
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2, bgcolor: '#2a2a4a' }} />

        {/* Нижняя строка — соцсети / контакты */}
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem' }}>
            Сделано с ❤️ для фанатов Team Fortress 2
          </Typography>
          <Box>
            <IconButton
              component="a"
              href="https://github.com/UnicornSereJa/arsenaltf2"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#888' }}
              size="small"
            >
              <GitHub fontSize="small" />
            </IconButton>
            <IconButton
              component="a"
              href="mailto:your-email@example.com"
              sx={{ color: '#888' }}
              size="small"
            >
              <Mail fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;