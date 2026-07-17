// Diagnóstico y Logging de Errores
(function() {
  const errors = [];
  const logs = [];
  
  // Capturar errores globales
  window.addEventListener('error', (event) => {
    errors.push({
      type: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString()
    });
    console.error('[ERROR CAPTURED]', event.message, `at ${event.filename}:${event.lineno}`);
  });
  
  // Capturar promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errors.push({
      type: 'unhandledRejection',
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString()
    });
    console.error('[UNHANDLED REJECTION]', event.reason);
  });
  
  // Enviar logs a localStorage para debugging
  window.DIAGNOSTICS = {
    getErrors: () => errors,
    getLogs: () => logs,
    report: () => {
      console.table(errors);
      console.log('Total errors:', errors.length);
    }
  };
  
  // Exponer errors para Chrome DevTools
  window.__ERRORS__ = errors;
})();
