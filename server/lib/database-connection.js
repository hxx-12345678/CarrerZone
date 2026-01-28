/**
 * Robust Database Connection Handler
 * Handles database connections with proper error handling and retry logic
 */

const { Sequelize } = require('sequelize');

class DatabaseConnection {
  constructor() {
    this.sequelize = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 2000; // 2 seconds
  }

  async connect() {
    try {
      console.log('🔌 Establishing database connection...');
      
      // Get database configuration
      const config = this.getDatabaseConfig();
      
      console.log('📋 Database config:', {
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        ssl: config.dialectOptions?.ssl?.require || false
      });
      
      // Create Sequelize instance
      this.sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
          host: config.host,
          port: config.port,
          dialect: config.dialect,
          logging: false, // Disable logging for cleaner output
          pool: config.pool,
          define: config.define,
          dialectOptions: config.dialectOptions,
          retry: {
            max: 3,
            timeout: 30000
          }
        }
      );
      
      // Test connection
      await this.sequelize.authenticate();
      this.isConnected = true;
      this.retryCount = 0;
      
      console.log('✅ Database connection established successfully');
      return this.sequelize;
      
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms...`);
        
        await this.delay(this.retryDelay);
        return this.connect();
      }
      
      throw error;
    }
  }

  async disconnect() {
    if (this.sequelize && this.isConnected) {
      try {
        await this.sequelize.close();
        this.isConnected = false;
        console.log('🔌 Database connection closed');
      } catch (error) {
        console.error('⚠️ Error closing database connection:', error.message);
      }
    }
  }

  getDatabaseConfig() {
    // Use DATABASE_URL only in production; otherwise prefer local envs
    const useDatabaseUrl = (process.env.NODE_ENV === 'production');
    const dbUrl = useDatabaseUrl ? (process.env.DATABASE_URL || process.env.DB_URL) : null;
    
    if (dbUrl) {
      try {
        const url = new URL(dbUrl);
        return {
          username: url.username,
          password: url.password,
          host: url.hostname,
          port: parseInt(url.port) || 5432,
          database: url.pathname.slice(1), // Remove leading slash
          dialect: 'postgres',
          logging: false,
          pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
          },
          define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true
          },
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        };
      } catch (error) {
        console.warn('⚠️ Failed to parse DATABASE_URL, using fallback config');
      }
    }
    
    // Fallback to individual environment variables (local defaults)
    return {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'jobportal_dev',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
      },
      dialectOptions: {}
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSequelize() {
    if (!this.sequelize || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.sequelize;
  }

  async testConnection() {
    try {
      if (!this.sequelize) {
        await this.connect();
      }
      
      await this.sequelize.authenticate();
      console.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
