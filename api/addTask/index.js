const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
    return;
  }

  if (!req.body || !req.body.text) {
    context.res = {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: 'Please provide a task text in the request body',
    };
    return;
  }

  try {
    const connectionString = process.env.AzureWebJobsStorage;
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('tasks');
    const blobClient = containerClient.getBlockBlobClient('tasks.json');

    const downloadBlockBlobResponse = await blobClient.download();
    const tasks =
      JSON.parse(
        await streamToString(downloadBlockBlobResponse.readableStreamBody)
      ) || [];

    const newTask = {
      id: uuidv4(),
      text: req.body.text,
      priority: req.body.priority || false,
      disabled: false,
      createdDate: new Date().toISOString().split('T')[0],
    };
    tasks.push(newTask);

    const tasksJson = JSON.stringify(tasks);
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: newTask,
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: `Error adding task: ${error.message}`,
    };
  }
};

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}
