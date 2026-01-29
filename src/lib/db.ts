import sql from 'mssql';

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
    return pool;
  }

  // Check for missing essential configuration
  if (!config.server || !config.user || !config.database) {
      console.error('Database configuration environment variables are not fully set.');
      throw new Error('Database configuration is missing.');
  }

  try {
    pool = await new sql.ConnectionPool(config).connect();
    console.log('Successfully connected to SQL Server.');
    
    pool.on('error', err => {
        console.error('SQL Pool Error', err);
        pool = null; // Reset pool on error to force reconnection on next call
    });

    return pool;
  } catch (err) {
    console.error('Database Connection Failed!', err);
    pool = null; // Ensure pool is null on failure
    throw new Error('Could not connect to the database.');
  }
}

export { sql, getConnection };
