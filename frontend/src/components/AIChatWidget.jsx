import React, { useState, Suspense, lazy } from 'react';
import { Button, Fade } from '@mui/material';

const AIChatPanel = lazy(() => import('./AIChatPanel'));

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
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
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] z-50">
          <Suspense fallback={null}>
            <AIChatPanel />
          </Suspense>
        </div>
      </Fade>
    </div>
  );
} 