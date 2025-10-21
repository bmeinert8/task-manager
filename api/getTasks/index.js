const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
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
    const tasks = JSON.parse(
      await streamToString(downloadBlockBlobResponse.readableStreamBody)
    );

    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: tasks,
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: `Error retrieving tasks: ${error.message}`,
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
