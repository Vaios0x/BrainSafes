import React, { useState, Suspense, lazy } from 'react';
import { Button, Fade } from '@mui/material';

const AIChatPanel = lazy(() => import('./AIChatPanel'));

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        style={{ borderRadius: '50%', minWidth: 56, minHeight: 56, width: 56, height: 56, boxShadow: '0 2px 8px #1976d220', fontSize: 28 }}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Cerrar chat IA' : 'Abrir chat IA'}
      >
        {open ? '×' : '🤖'}
      </Button>
      <Fade in={open} unmountOnExit>
        <div style={{ position: 'absolute', bottom: 72, right: 0, width: 380, maxWidth: '90vw' }}>
          <Suspense fallback={null}>
            <AIChatPanel />
          </Suspense>
        </div>
      </Fade>
    </>
  );
} 