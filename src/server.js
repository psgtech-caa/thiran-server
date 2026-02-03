const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');

dotenv.config();

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Thiran Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Thiran 2026 API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

app.use(generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ████████╗██╗  ██╗██╗██████╗  █████╗ ███╗   ██╗      ║
║     ╚══██╔══╝██║  ██║██║██╔══██╗██╔══██╗████╗  ██║      ║
║        ██║   ███████║██║██████╔╝███████║██╔██╗ ██║      ║
║        ██║   ██╔══██║██║██╔══██╗██╔══██║██║╚██╗██║      ║
║        ██║   ██║  ██║██║██║  ██║██║  ██║██║ ╚████║      ║
║        ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝      ║
║                                                           ║
║              Event Management System 2026                 ║
║         PSG College of Technology - Coimbatore           ║
║      Department of Computer Applications                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📡 API Base: http://localhost:${PORT}/api
💚 Health Check: http://localhost:${PORT}/health

Ready to accept connections...
    `);
    logger.info(`Thiran server started on port ${PORT}`);
  });
}

module.exports = app;
