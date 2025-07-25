import React from 'react'
import { Box, Typography, Link, IconButton, Stack, Container } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import TwitterIcon from '@mui/icons-material/Twitter'
import EmailIcon from '@mui/icons-material/Email'
import ForumIcon from '@mui/icons-material/Forum'
import SchoolIcon from '@mui/icons-material/School'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Courses', href: '/courses' },
  { label: 'Certificates', href: '/certificates' },
  { label: 'Profile', href: '/profile' },
  { label: 'Docs', href: '/docs' }
]

const socials = [
  { icon: <ForumIcon />, href: 'https://discord.gg/brainsafes', label: 'Discord' },
  { icon: <TwitterIcon />, href: 'https://twitter.com/brainsafes', label: 'Twitter' },
  { icon: <GitHubIcon />, href: 'https://github.com/Vaios0x/BrainSafes', label: 'GitHub' },
  { icon: <EmailIcon />, href: 'mailto:contact@brainsafes.com', label: 'Email' }
]

export default function Footer() {
  return (
    <Box sx={{
      width: '100vw',
      bgcolor: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
      color: 'white',
      mt: 8,
      py: { xs: 4, md: 6 },
      px: 0,
      boxShadow: 8
    }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 8 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={4}>
          {/* Logo y nombre */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <SchoolIcon sx={{ fontSize: 40, color: 'white', filter: 'drop-shadow(0 2px 8px #1976d2)' }} />
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1 }}>
              BrainSafes
            </Typography>
          </Stack>

          {/* Links rápidos */}
          <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
            {links.map(link => (
              <Link
                key={link.label}
                href={link.href}
                underline="none"
                color="inherit"
                sx={{ fontWeight: 500, fontSize: 16, opacity: 0.9, transition: 'opacity 0.2s', ':hover': { opacity: 1, textDecoration: 'underline' } }}
              >
                {link.label}
              </Link>
            ))}
          </Stack>

          {/* Redes sociales */}
          <Stack direction="row" spacing={1}>
            {socials.map(social => (
              <IconButton
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.08)', mx: 0.5, transition: 'transform 0.2s', ':hover': { bgcolor: 'white', color: '#1976d2', transform: 'scale(1.15)' } }}
                aria-label={social.label}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>
        </Stack>
        <Typography variant="body2" align="center" sx={{ mt: 4, opacity: 0.8 }}>
          © {new Date().getFullYear()} BrainSafes. Made with <span style={{ color: '#ff4081', fontWeight: 700 }}>❤️</span> for the future of education.
        </Typography>
      </Container>
    </Box>
  )
} 