const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  try {
    const connectionString = process.env.AzureWebJobsStorage;
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('tasks');
    const blobClient = containerClient.getBlockBlobClient('tasks.json');

    let tasks = [];
    if (await blobClient.exists()) {
      const downloadBlockBlobResponse = await blobClient.download();
      const downloaded = await streamToString(
        downloadBlockBlobResponse.readableStreamBody
      );
      tasks = JSON.parse(downloaded) || [];
    }

    context.res = {
      status: 200,
      body: tasks,
    };
  } catch (error) {
    context.res = {
      status: 500,
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
