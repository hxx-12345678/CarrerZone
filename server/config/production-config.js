/**
 * Production Configuration
 * Optimized settings for production deployment
 */

// Production environment configuration
function getProductionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Server settings
    port: process.env.PORT || 8000,
    host: process.env.HOST || '0.0.0.0',
    
    // Security settings
    trustProxy: true,
    helmet: {
      contentSecurityPolicy: isProduction ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "http://localhost:8000"]
        }
      } : false,
      crossOriginEmbedderPolicy: false
    },
    
    // CORS settings
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          process.env.CORS_ORIGIN || 'http://localhost:3000',
          'http://localhost:3000',
          'http://localhost:3001'
        ];
        
        const isAllowed = allowedOrigins.some(allowedOrigin => {
          if (typeof allowedOrigin === 'string') {
            return allowedOrigin === origin;
          } else if (allowedOrigin instanceof RegExp) {
            return allowedOrigin.test(origin);
          }
          return false;
        });
        
        callback(null, isAllowed);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
      ],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      optionsSuccessStatus: 200,
      preflightContinue: false,
      maxAge: 86400
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 100 : 1000, // More restrictive in production
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // Body parsing
    bodyParser: {
      json: { 
        limit: '10mb',
        verify: (req, res, buf) => {
          // Add any custom verification logic here
        }
      },
      urlencoded: { 
        extended: true, 
        limit: '10mb' 
      }
    },
    
    // Compression
    compression: {
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return true;
      }
    },
    
    // Logging
    logging: {
      level: isProduction ? 'combined' : 'dev',
      skip: (req, res) => {
        // Skip logging for health checks and static assets
        return req.url === '/health' || req.url.startsWith('/static');
      }
    },
    
    // Database
    database: {
      logging: !isProduction, // Disable SQL logging in production
      pool: {
        max: isProduction ? 10 : 5,
        min: isProduction ? 2 : 0,
        acquire: 30000,
        idle: 10000
      }
    },
    
    // Email
    email: {
      enabled: true,
      timeout: 10000,
      retries: 3
    },
    
    // File uploads
    uploads: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      destination: './uploads'
    }
  };
}

// Health check configuration
function getHealthCheckConfig() {
  return {
    path: '/health',
    response: {
      status: 'OK',
      timestamp: () => new Date().toISOString(),
      uptime: () => process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: () => {
        const memUsage = process.memoryUsage();
        return {
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        };
      }
    }
  };
}

// Error handling configuration
function getErrorHandlingConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    showStack: !isProduction,
    showMessage: true,
    logErrors: true,
    includeStackTrace: !isProduction
  };
}

module.exports = { 
  getProductionConfig, 
  getHealthCheckConfig, 
  getErrorHandlingConfig 
};
