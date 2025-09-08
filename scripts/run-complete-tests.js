#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧠 BrainSafes - Complete Testing Suite');
console.log('=====================================\n');

// Configuración de tests
const testSuites = [
  {
    name: 'Integration Tests',
    command: 'npx hardhat test test/integration/completeIntegration.test.js',
    description: 'Tests de integración completos para todos los contratos'
  },
  {
    name: 'Stress Tests',
    command: 'npx hardhat test test/stress/batchOperationsStress.test.js',
    description: 'Tests de stress para operaciones batch'
  },
  {
    name: 'Cross-Chain Bridge Tests',
    command: 'npx hardhat test test/bridge/crossChainBridge.test.js',
    description: 'Tests de cross-chain bridge'
  },
  {
    name: 'AI Processor Stylus Tests',
    command: 'npx hardhat test test/stylus/aiProcessorStylus.test.js',
    description: 'Tests de AI processor con Stylus'
  },
  {
    name: 'Performance & Gas Tests',
    command: 'npx hardhat test test/performance/gasOptimization.test.js',
    description: 'Tests de performance y gas optimization'
  },
  {
    name: 'Security Tests',
    command: 'npx hardhat test test/security/',
    description: 'Tests de seguridad completos'
  },
  {
    name: 'Frontend E2E Tests',
    command: 'cd frontend && npm run cypress:run',
    description: 'Tests de frontend con Cypress'
  }
];

// Función para ejecutar test suite
function runTestSuite(suite) {
  console.log(`\n🚀 Ejecutando: ${suite.name}`);
  console.log(`📝 Descripción: ${suite.description}`);
  console.log('─'.repeat(60));
  
  try {
    const startTime = Date.now();
    const output = execSync(suite.command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 300000 // 5 minutos por suite
    });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ ${suite.name} completado en ${duration.toFixed(2)}s`);
    
    // Extraer estadísticas del output
    const stats = extractTestStats(output);
    
    return {
      name: suite.name,
      status: 'PASSED',
      duration: duration,
      stats: stats,
      output: output
    };
  } catch (error) {
    console.log(`❌ ${suite.name} falló`);
    console.log(`Error: ${error.message}`);
    
    return {
      name: suite.name,
      status: 'FAILED',
      duration: 0,
      stats: { tests: 0, passed: 0, failed: 0 },
      output: error.stdout || error.message
    };
  }
}

// Función para extraer estadísticas de tests
function extractTestStats(output) {
  const stats = {
    tests: 0,
    passed: 0,
    failed: 0,
    gasUsed: 0,
    coverage: 0
  };
  
  // Buscar patrones en el output
  const testMatch = output.match(/(\d+) passing/);
  if (testMatch) {
    stats.passed = parseInt(testMatch[1]);
  }
  
  const failMatch = output.match(/(\d+) failing/);
  if (failMatch) {
    stats.failed = parseInt(failMatch[1]);
  }
  
  stats.tests = stats.passed + stats.failed;
  
  // Extraer información de gas
  const gasMatch = output.match(/Gas used: ([\d.]+)/g);
  if (gasMatch) {
    stats.gasUsed = gasMatch.length;
  }
  
  return stats;
}

// Función para generar reporte
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites: results.length,
      passedSuites: results.filter(r => r.status === 'PASSED').length,
      failedSuites: results.filter(r => r.status === 'FAILED').length,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalDuration: 0
    },
    suites: results,
    recommendations: []
  };
  
  // Calcular totales
  results.forEach(result => {
    report.summary.totalTests += result.stats.tests;
    report.summary.totalPassed += result.stats.passed;
    report.summary.totalFailed += result.stats.failed;
    report.summary.totalDuration += result.duration;
  });
  
  // Generar recomendaciones
  if (report.summary.failedSuites > 0) {
    report.recommendations.push('Revisar y corregir los tests fallidos antes del deployment');
  }
  
  if (report.summary.totalDuration > 300) {
    report.recommendations.push('Considerar optimizar tests para reducir tiempo de ejecución');
  }
  
  const failedSuites = results.filter(r => r.status === 'FAILED');
  if (failedSuites.length > 0) {
    report.recommendations.push(`Suites que necesitan atención: ${failedSuites.map(s => s.name).join(', ')}`);
  }
  
  return report;
}

// Función para mostrar reporte
function displayReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 REPORTE COMPLETO DE TESTS - BRAINSAFES');
  console.log('='.repeat(80));
  
  console.log(`\n📅 Timestamp: ${new Date(report.timestamp).toLocaleString()}`);
  
  console.log('\n📈 RESUMEN GENERAL:');
  console.log(`- Total de Suites: ${report.summary.totalSuites}`);
  console.log(`- Suites Exitosos: ${report.summary.passedSuites} ✅`);
  console.log(`- Suites Fallidos: ${report.summary.failedSuites} ❌`);
  console.log(`- Total de Tests: ${report.summary.totalTests}`);
  console.log(`- Tests Exitosos: ${report.summary.totalPassed} ✅`);
  console.log(`- Tests Fallidos: ${report.summary.totalFailed} ❌`);
  console.log(`- Tiempo Total: ${report.summary.totalDuration.toFixed(2)}s`);
  
  console.log('\n📋 DETALLE POR SUITE:');
  report.suites.forEach(suite => {
    const status = suite.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${suite.name}`);
    console.log(`   - Estado: ${suite.status}`);
    console.log(`   - Duración: ${suite.duration.toFixed(2)}s`);
    console.log(`   - Tests: ${suite.stats.tests} (${suite.stats.passed} ✅, ${suite.stats.failed} ❌)`);
    if (suite.stats.gasUsed > 0) {
      console.log(`   - Operaciones de Gas: ${suite.stats.gasUsed}`);
    }
  });
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMENDACIONES:');
    report.recommendations.forEach(rec => {
      console.log(`- ${rec}`);
    });
  }
  
  // Calcular métricas de calidad
  const successRate = (report.summary.passedSuites / report.summary.totalSuites) * 100;
  const testSuccessRate = report.summary.totalTests > 0 ? 
    (report.summary.totalPassed / report.summary.totalTests) * 100 : 0;
  
  console.log('\n🎯 MÉTRICAS DE CALIDAD:');
  console.log(`- Tasa de Éxito de Suites: ${successRate.toFixed(1)}%`);
  console.log(`- Tasa de Éxito de Tests: ${testSuccessRate.toFixed(1)}%`);
  
  if (successRate >= 90) {
    console.log('🏆 EXCELENTE: Sistema listo para deployment');
  } else if (successRate >= 75) {
    console.log('👍 BUENO: Revisar tests fallidos antes del deployment');
  } else {
    console.log('⚠️  ATENCIÓN: Necesita correcciones significativas');
  }
}

// Función para guardar reporte
function saveReport(report) {
  const reportDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(reportDir, `test-report-${timestamp}.json`);
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n💾 Reporte guardado en: ${reportFile}`);
  
  // También generar reporte en formato legible
  const readableReportFile = path.join(reportDir, `test-report-${timestamp}.txt`);
  const readableContent = generateReadableReport(report);
  fs.writeFileSync(readableReportFile, readableContent);
  console.log(`📄 Reporte legible guardado en: ${readableReportFile}`);
}

// Función para generar reporte legible
function generateReadableReport(report) {
  let content = '';
  content += 'BRAINSAFES - REPORTE COMPLETO DE TESTS\n';
  content += '======================================\n\n';
  content += `Fecha: ${new Date(report.timestamp).toLocaleString()}\n\n`;
  
  content += 'RESUMEN GENERAL:\n';
  content += `- Total de Suites: ${report.summary.totalSuites}\n`;
  content += `- Suites Exitosos: ${report.summary.passedSuites}\n`;
  content += `- Suites Fallidos: ${report.summary.failedSuites}\n`;
  content += `- Total de Tests: ${report.summary.totalTests}\n`;
  content += `- Tests Exitosos: ${report.summary.totalPassed}\n`;
  content += `- Tests Fallidos: ${report.summary.totalFailed}\n`;
  content += `- Tiempo Total: ${report.summary.totalDuration.toFixed(2)}s\n\n`;
  
  content += 'DETALLE POR SUITE:\n';
  report.suites.forEach(suite => {
    content += `${suite.status === 'PASSED' ? '✅' : '❌'} ${suite.name}\n`;
    content += `   Estado: ${suite.status}\n`;
    content += `   Duración: ${suite.duration.toFixed(2)}s\n`;
    content += `   Tests: ${suite.stats.tests} (${suite.stats.passed} ✅, ${suite.stats.failed} ❌)\n`;
    if (suite.stats.gasUsed > 0) {
      content += `   Operaciones de Gas: ${suite.stats.gasUsed}\n`;
    }
    content += '\n';
  });
  
  if (report.recommendations.length > 0) {
    content += 'RECOMENDACIONES:\n';
    report.recommendations.forEach(rec => {
      content += `- ${rec}\n`;
    });
    content += '\n';
  }
  
  return content;
}

// Función principal
async function main() {
  console.log('🔧 Iniciando suite completa de tests...\n');
  
  const results = [];
  
  // Ejecutar cada suite de tests
  for (const suite of testSuites) {
    const result = runTestSuite(suite);
    results.push(result);
    
    // Pausa entre suites para evitar sobrecarga
    if (suite !== testSuites[testSuites.length - 1]) {
      console.log('⏳ Esperando 2 segundos antes del siguiente test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generar y mostrar reporte
  const report = generateReport(results);
  displayReport(report);
  saveReport(report);
  
  // Exit code basado en resultados
  const exitCode = report.summary.failedSuites > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Manejar errores
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error en ejecución:', error);
    process.exit(1);
  });
}

module.exports = {
  runTestSuite,
  generateReport,
  displayReport,
  saveReport
};
