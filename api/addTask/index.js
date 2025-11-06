const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  context.log('🔥 addTask function STARTED');

  if (!req.body || !req.body.text) {
    context.log('❌ Missing text');
    context.res = { status: 400, body: 'Please provide text' };
    return;
  }

  try {
    context.log('✅ Getting connection string');
    const connectionString = process.env.AzureWebJobsStorage;
    if (!connectionString) throw new Error('NO CONNECTION STRING!');
    context.log(`✅ Connection string OK (${connectionString.length} chars)`);

    context.log('✅ Creating BlobServiceClient');
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('tasks');

    context.log('✅ Creating container if not exists');
    await containerClient.createIfNotExists();
    context.log('✅ Container OK');

    const blobClient = containerClient.getBlockBlobClient('tasks.json');
    let tasks = [];

    context.log('✅ Checking blob exists');
    const blobExists = await blobClient.exists();
    context.log(`✅ Blob exists: ${blobExists}`);

    if (blobExists) {
      context.log('✅ Downloading tasks');
      const download = await blobClient.download();
      const data = await streamToString(download.readableStreamBody);
      tasks = JSON.parse(data || '[]');
    } else {
      context.log('✅ No blob - starting empty');
    }

    const newTask = {
      id: uuidv4(),
      text: req.body.text,
      priority: req.body.priority || false,
      disabled: false,
      createdDate: new Date().toISOString().split('T')[0],
    };
    tasks.push(newTask);
    context.log(`✅ Added task: ${newTask.id}`);

    context.log('✅ Uploading tasks.json');
    const tasksJson = JSON.stringify(tasks);
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    context.log('✅ UPLOAD SUCCESS!');

    context.res = { status: 200, body: newTask };
  } catch (error) {
    context.log.error('💥 FULL ERROR:', error.message);
    context.log.error('💥 STACK:', error.stack);
    context.res = {
      status: 500,
      body: `ERROR: ${error.message}`,
    };
  }
};

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => chunks.push(data.toString()));
    readableStream.on('end', () => resolve(chunks.join('')));
    readableStream.on('error', reject);
  });
}
