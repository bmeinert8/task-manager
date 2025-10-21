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

  try {
    const connectionString = process.env.AzureWebJobsStorage;
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('tasks');
    const blobClient = containerClient.getBlockBlobClient('tasks.json');

    const tasksJson = JSON.stringify([]);
    context.log('Clearing all tasks');
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: 'All tasks deleted successfully',
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin':
          'https://proud-tree-067f7980f.1.azurestaticapps.net',
      },
      body: `Error deleting all tasks: ${error.message}`,
    };
  }
};
