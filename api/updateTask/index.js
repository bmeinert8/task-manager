const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  const id = context.bindingData.id;
  if (!id || !req.body || req.body.disabled === undefined) {
    context.res = {
      status: 400,
      body: 'Please provide a task ID and disabled status in the request body',
    };
    return;
  }

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

    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      context.res = {
        status: 404,
        body: 'Task not found',
      };
      return;
    }

    tasks[taskIndex].disabled = req.body.disabled;
    const tasksJson = JSON.stringify(tasks);
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 200,
      body: tasks[taskIndex],
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error updating task: ${error.message}`,
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
