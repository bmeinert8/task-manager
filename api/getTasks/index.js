const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  try {
    // Initialize BlobServiceClient with connection string
    const connectionString = process.env.AzureWebJobsStorage;
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('tasks');
    const blobClient = containerClient.getBlockBlobClient('tasks.json');

    // Try to download tasks.json
    try {
      const downloadResponse = await blobClient.download();
      const tasksJson = await streamToText(downloadResponse.readableStreamBody);
      const tasks = JSON.parse(tasksJson || '[]');
      context.res = {
        status: 200,
        body: tasks,
      };
    } catch (error) {
      if (error.statusCode === 404) {
        // Blob doesn't exist yet, return empty array
        context.res = {
          status: 200,
          body: [],
        };
      } else {
        throw error; // Rethrow other errors
      }
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error fetching tasks: ${error.message}`,
    };
  }
};

// Helper function to convert stream to text
async function streamToText(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}
