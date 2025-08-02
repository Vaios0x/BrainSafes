import React from 'react';
import { useTranslation } from 'react-i18next';
import Hero from '../assets/Hero.svg?react';
import { useTheme, useMediaQuery, Box, Typography, Button, Container, Grid, Card, CardContent, Fade } from '@mui/material';

const benefits = [
  {
    icon: '🔒',
    iconLabel: 'Seguro',
    title: 'landing.benefit1',
    desc: 'landing.benefit1desc',
  },
  {
    icon: '⚡',
    iconLabel: 'Rápido',
    title: 'landing.benefit2',
    desc: 'landing.benefit2desc',
  },
  {
    icon: '🌐',
    iconLabel: 'Global',
    title: 'landing.benefit3',
    desc: 'landing.benefit3desc',
  },
];

export default function Landing() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Animación de entrada simple
  React.useEffect(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      el.style.opacity = 0;
      el.style.transform = 'translateY(40px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1)';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      }, 200 + i * 150);
    });
  }, []);

  return (
    <Box 
      component="main" 
      role="main" 
      aria-label="Página principal" 
      sx={{ 
        minHeight: 'calc(100vh - 80px)', 
        background: theme.palette.background.paper,
        overflow: 'hidden'
      }}
    >
      {/* Hero Section */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 4, sm: 6, md: 8 },
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Grid 
          container 
          spacing={{ xs: 3, md: 6 }}
          alignItems="center"
          sx={{ minHeight: { xs: '60vh', sm: '70vh' } }}
        >
          {/* Text Content */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={800}>
              <Box className="fade-in">
                <Typography 
                  variant="h1" 
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: { xs: 2, sm: 3 },
                    color: theme.palette.primary.main,
                    letterSpacing: -1,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                    textAlign: { xs: 'center', md: 'left' }
                  }}
                >
                  {t('landing.title')}
                </Typography>
                
                <Typography 
                  variant="h5" 
                  component="p"
                  sx={{
                    mb: { xs: 3, sm: 4 },
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                    lineHeight: 1.5,
                    textAlign: { xs: 'center', md: 'left' },
                    opacity: 0.8
                  }}
                >
                  {t('landing.subtitle')}
                </Typography>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    gap: 2,
                    flexWrap: 'wrap'
                  }}
                >
                  <Button
                    component="a"
                    href="#benefits"
                    variant="contained"
                    size="large"
                    className="cta-btn fade-in touch-button"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      boxShadow: theme.shadows[4],
                      minHeight: { xs: 48, sm: 56 },
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.getElementById('benefits').scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {t('landing.cta')}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    className="touch-button"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      minHeight: { xs: 48, sm: 56 }
                    }}
                  >
                    Saber más
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Grid>

          {/* Hero Image */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={1000}>
              <Box 
                className="fade-in"
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', md: 'flex-end' },
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <Hero 
                  width={isMobile ? 200 : isTablet ? 280 : 320} 
                  height={isMobile ? 150 : isTablet ? 210 : 240}
                  style={{ 
                    maxWidth: '100%',
                    height: 'auto',
                    filter: theme.palette.mode === 'dark' ? 'brightness(0.9)' : 'none'
                  }}
                />
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box 
        id="benefits" 
        component="section" 
        role="region" 
        aria-label="Beneficios principales" 
        sx={{
          background: theme.palette.background.default,
          py: { xs: 4, sm: 6, md: 8 },
          mt: { xs: 2, sm: 4 }
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Typography 
            variant="h2" 
            component="h2"
            sx={{
              textAlign: 'center',
              mb: { xs: 3, sm: 4, md: 6 },
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              fontWeight: 700,
              color: theme.palette.text.primary
            }}
          >
            ¿Por qué elegir BrainSafes?
          </Typography>
          
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={4} key={benefit.title}>
                <Fade in timeout={800 + index * 200}>
                  <Card
                    className="benefit-card fade-in"
                    role="article"
                    aria-label={t(benefit.title)}
                    tabIndex={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      p: { xs: 2, sm: 3, md: 4 },
                      borderRadius: 3,
                      boxShadow: theme.shadows[2],
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                        transform: 'translateY(-4px)',
                        backgroundColor: theme.palette.background.paper
                      },
                      '&:focus': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: '4px'
                      }
                    }}
                  >
                    <Box
                      role="img"
                      aria-label={benefit.iconLabel}
                      sx={{
                        fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: { xs: 60, sm: 80 },
                        height: { xs: 60, sm: 80 },
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.light + '20',
                        color: theme.palette.primary.main
                      }}
                    >
                      {benefit.icon}
                    </Box>
                    
                    <Typography 
                      variant="h5" 
                      component="h3"
                      sx={{
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 2,
                        lineHeight: 1.3
                      }}
                    >
                      {t(benefit.title)}
                    </Typography>
                    
                    <Typography 
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        lineHeight: 1.6,
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {t(benefit.desc)}
                    </Typography>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
} 