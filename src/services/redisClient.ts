import Redis from 'ioredis';

// Redis client configuration
let redisClient: Redis | null = null;

// Initialize Redis client
export const getRedisClient = () => {
  if (!redisClient) {
    // In production, use environment variables for connection details
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        // Retry connection with exponential backoff
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis server');
    });
  }

  return redisClient;
};

// Close Redis connection
export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
};
