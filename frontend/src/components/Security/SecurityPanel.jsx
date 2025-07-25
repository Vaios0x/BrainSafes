import React, { useState } from 'react';
import SecurityAlerts from './SecurityAlerts';
import SecurityAuditStatus from './SecurityAuditStatus';
import SecurityAlertConfig from './SecurityAlertConfig';
import SecurityAttackChart from './SecurityAttackChart';
import SecurityReportExport from './SecurityReportExport';
import { Tabs, Tab, Box } from '@mui/material';

export default function SecurityPanel() {
  const [tab, setTab] = useState(0);
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Panel de Seguridad</h2>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Alertas" />
        <Tab label="Auditorías" />
        <Tab label="Configuración" />
        <Tab label="Gráficos" />
        <Tab label="Exportar" />
      </Tabs>
      <Box mt={3}>
        {tab === 0 && <SecurityAlerts />}
        {tab === 1 && <SecurityAuditStatus />}
        {tab === 2 && <SecurityAlertConfig />}
        {tab === 3 && <SecurityAttackChart />}
        {tab === 4 && <SecurityReportExport />}
      </Box>
    </div>
  );
} 