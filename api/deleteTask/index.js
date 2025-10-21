const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
    return;
  }

  const id = context.bindingData.id;
  if (!id) {
    context.res = {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: 'Please provide a task ID',
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
    let tasks =
      JSON.parse(
        await streamToString(downloadBlockBlobResponse.readableStreamBody)
      ) || [];

    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      context.res = {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin':
            'https://proud-tree-067f7980f.1.azurestaticapps.net',
        },
        body: 'Task not found',
      };
      return;
    }

    tasks.splice(taskIndex, 1);
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
      body: `Task ${id} deleted`,
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: `Error deleting task: ${error.message}`,
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
