const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context) {
  try {
    const connectionString = process.env.AzureWebJobsStorage;
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('tasks');
    const blobClient = containerClient.getBlockBlobClient('tasks.json');

    let tasks = [];
    try {
      const downloadResponse = await blobClient.download();
      const tasksJson = await streamToText(downloadResponse.readableStreamBody);
      tasks = JSON.parse(tasksJson || '[]');
    } catch (error) {
      if (error.statusCode === 404) {
        context.res = {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Max-Age': '86400',
          },
          body: [],
        };
        return;
      }
      throw error;
    }

    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: tasks,
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
      },
      body: `Error retrieving tasks: ${error.message}`,
    };
  }
};

async function streamToText(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}
