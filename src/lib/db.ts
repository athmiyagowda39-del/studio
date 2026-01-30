
import sql from 'mssql';
import { logger } from './logger';

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

let pool: sql.ConnectionPool | null = null;

async function getConnection() {
  // If pool exists and is connected, return it.
  if (pool && pool.connected) {
    logger.log('Returning existing database connection from pool.');
    return pool;
  }

  const { password, ...configWithoutPassword } = config;
  logger.log('Database config (password omitted):', JSON.stringify(configWithoutPassword, null, 2));


  // Check for missing essential configuration
  if (!config.server || !config.user || !config.database) {
      logger.error('Database configuration environment variables are not fully set.');
      throw new Error('Database configuration is missing.');
  }

  try {
    logger.log('No existing connection pool found or not connected. Creating new connection...');
    pool = await new sql.ConnectionPool(config).connect();
    logger.log('Successfully connected to SQL Server.');
    
    pool.on('error', err => {
        logger.error('SQL Pool Error', err);
        pool = null; // Reset pool on error to force reconnection on next call
    });

    return pool;
  } catch (err) {
    logger.error('Database Connection Failed!', err);
    pool = null; // Ensure pool is null on failure
    throw new Error('Could not connect to the database.');
  }
}

export { sql, getConnection };
