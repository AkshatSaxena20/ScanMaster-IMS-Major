require('dotenv').config();
const app = require('./app');
const { connect } = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connect();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`
╔══════════════════════════════════════╗
║       ScanMaster IMS — Server        ║
╠══════════════════════════════════════╣
║  Status  : Running                   ║
║  Port    : ${PORT}                       ║
║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(26)}║
╚══════════════════════════════════════╝
    `);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

start();
