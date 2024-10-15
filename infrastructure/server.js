const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { setupMaster, setupWorker } = require('@socket.io/sticky');
const { createAdapter, setupPrimary } = require('@socket.io/cluster-adapter');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const Redis = require('ioredis');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection',
  });
  setupPrimary();

  httpServer.listen(3000);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const redis = new Redis(REDIS_URL);
  const pubClient = redis;
  const subClient = pubClient.duplicate();

  app.prepare().then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    const io = require('socket.io')(server);
    io.adapter(createAdapter(pubClient, subClient));
    setupWorker(io);

    io.on('connection', (socket) => {
      console.log('A user connected');
      // Add your socket.io event handlers here
    });

    server.listen(0, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${server.address().port}`);
    });
  });
}
