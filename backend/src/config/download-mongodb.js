const { MongoMemoryServer } = require('mongodb-memory-server');

async function download() {
  console.log('Téléchargement de MongoDB binaire...');
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'erp_auto' },
  });
  console.log('URI:', mongod.getUri());
  await mongod.stop();
  console.log('✅ MongoDB binaire téléchargé et prêt');
}

download().catch(console.error);
