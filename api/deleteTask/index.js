const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
    return;
  }

  try {
    const taskId = context.bindingData.id;
    if (!taskId) {
      context.res = {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        },
        body: 'Task ID is required in the URL',
      };
      return;
    }

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
      if (error.statusCode !== 404) {
        throw error;
      }
      context.res = {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        },
        body: 'No tasks found',
      };
      return;
    }

    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      context.res = {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        },
        body: `Task with ID ${taskId} not found`,
      };
      return;
    }

    tasks.splice(taskIndex, 1);

    const tasksJson = JSON.stringify(tasks);
    context.log('Updating tasks after deletion:', tasksJson);
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
      },
      body: 'Task deleted successfully',
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
      },
      body: `Error deleting task: ${error.message}`,
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
