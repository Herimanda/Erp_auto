const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

async function startMongoMemoryServer() {
  if (mongoServer) return mongoServer.getUri();

  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'erp_auto',
    },
  });

  const uri = mongoServer.getUri();
  console.log('MongoDB Memory Server started at:', uri);
  return uri;
}

async function stopMongoMemoryServer() {
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

module.exports = { startMongoMemoryServer, stopMongoMemoryServer };
