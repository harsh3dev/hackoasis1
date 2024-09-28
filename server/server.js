const express = require('express');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const app = express();

// Redis client setup
const redisClient = redis.createClient({
    url: 'redis://localhost:6379',
    legacyMode: true
});
redisClient.connect().catch(console.error);

// Constants for DDoS Protection
const WINDOW_SIZE = 1 * 60 * 1000; // 1 minute
const MAX_GLOBAL_REQUESTS = 500; // Global limit on requests per minute
const MAX_UNIQUE_IPS = 100; // Max unique IPs in 1 minute
const DDoSThreshold = 50; // Threshold for marking IP as suspicious

// Helper functions for Redis interactions
const incrementGlobalCounter = (key, expiration) => {
    return redisClient.incr(key, (err, count) => {
        if (count === 1) {
            redisClient.expire(key, expiration);
        }
    });
};

const blockIPInRedis = (ip) => {
    redisClient.set(ip, 'blocked', 'EX', 60 * 60 * 24); // Block IP for 24 hours
};

const isIPBlockedInRedis = async (ip) => {
    return new Promise((resolve, reject) => {
        redisClient.get(ip, (err, reply) => {
            if (err) return reject(err);
            resolve(reply === 'blocked');
        });
    });
};

// Middleware to block IPs using Redis
const blockIPMiddleware = async (req, res, next) => {
    const clientIP = req.ip;

    const isBlocked = await isIPBlockedInRedis(clientIP);
    if (isBlocked) {
        return res.status(403).send('Your IP has been blocked.');
    }

    next();
};

// Middleware to detect suspicious IP behavior
const suspiciousIPMiddleware = async (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    // Track global request count
    await incrementGlobalCounter('global_requests', WINDOW_SIZE / 1000);

    // Track unique IPs in a Redis set
    redisClient.sadd('unique_ips', ip);
    redisClient.expire('unique_ips', WINDOW_SIZE / 1000); // Expire unique IP set after each window

    // Track requests from each individual IP
    const ipKey = `ip:${ip}:requests`;
    redisClient.incr(ipKey, (err, count) => {
        if (count === 1) {
            redisClient.expire(ipKey, WINDOW_SIZE / 1000);
        }

        // If IP exceeds DDoSThreshold within window, block it
        if (count > DDoSThreshold) {
            console.log(`Suspicious IP detected: ${ip}. Blocking for 10 minutes.`);
            blockIPInRedis(ip); // Block IP for 10 minutes
        }
    });

    // Reset counters and check global metrics
    redisClient.get('global_requests', async (err, globalRequests) => {
        const uniqueIPCount = await redisClient.scard('unique_ips');

        if (globalRequests > MAX_GLOBAL_REQUESTS || uniqueIPCount > MAX_UNIQUE_IPS) {
            console.log(`Global traffic limit exceeded! Total Requests: ${globalRequests}, Unique IPs: ${uniqueIPCount}`);
            blockIPInRedis(ip); // Block IP if part of a global DDoS attack
        }
    });

    next();
};

// Apply the IP blocking and DDoS protection middlewares
app.use(blockIPMiddleware);
app.use(suspiciousIPMiddleware);

// Rate limiting middleware using Redis store
const limiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res) => {
        const ip = req.ip;
        blockIPInRedis(ip); // Block IP if rate limit is exceeded
        res.status(429).json({ message: "Too many requests, IP blocked." });
    }
});

// Apply rate limiting middleware globally
app.use(limiter);

// Example routes
app.get('/', (req, res) => {
    res.send('Welcome to the homepage!');
});

app.get('/api', (req, res) => {
    res.send('API endpoint');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
