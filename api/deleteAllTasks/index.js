const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
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
      body: 'All tasks deleted successfully',
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error deleting all tasks: ${error.message}`,
    };
  }
};
