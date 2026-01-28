/**
 * Robust Database Connection Handler
 * Handles database connections with proper error handling and retry logic
 */

const { Sequelize } = require('sequelize');

class RobustDatabaseConnection {
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

      // Test the connection
      await this.sequelize.authenticate();
      
      this.isConnected = true;
      this.retryCount = 0;
      console.log('✅ Database connection established successfully');
      
      return this.sequelize;
    } catch (error) {
      this.retryCount++;
      console.error(`❌ Database connection failed (attempt ${this.retryCount}/${this.maxRetries}):`, error.message);
      
      if (this.retryCount < this.maxRetries) {
        console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
        await this.sleep(this.retryDelay);
        return this.connect();
      } else {
        throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${error.message}`);
      }
    }
  }

  async disconnect() {
    try {
      if (this.sequelize && this.isConnected) {
        await this.sequelize.close();
        this.isConnected = false;
        console.log('🔌 Database connection closed');
      }
    } catch (error) {
      console.log('⚠️ Error closing database connection:', error.message);
    }
  }

  async testConnection() {
    try {
      if (!this.sequelize || !this.isConnected) {
        await this.connect();
      }
      
      await this.sequelize.authenticate();
      console.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      console.log('❌ Database connection test failed:', error.message);
      return false;
    }
  }

  getDatabaseConfig() {
    const databaseUrl = process.env.NODE_ENV === 'production' ? process.env.DATABASE_URL : null;
    
    if (databaseUrl) {
      // Parse DATABASE_URL
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.substring(1), // Remove leading slash
        username: url.username,
        password: url.password,
        dialect: 'postgres',
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true
        },
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      };
    } else {
      // Fallback to individual environment variables
      return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'jobportal_dev',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        dialect: 'postgres',
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true
        },
        dialectOptions: {}
      };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSequelize() {
    return this.sequelize;
  }

  isConnectionActive() {
    return this.isConnected && this.sequelize;
  }
}

// Create singleton instance
const dbConnection = new RobustDatabaseConnection();

module.exports = dbConnection;
