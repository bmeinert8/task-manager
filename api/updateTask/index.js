const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        'Access-Control-Allow-Methods': 'PUT,OPTIONS',
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

    const updates = req.body;
    if (
      !updates ||
      (updates.disabled === undefined && updates.priority === undefined)
    ) {
      context.res = {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        },
        body: 'At least one of disabled or priority must be provided',
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

    if (updates.disabled !== undefined) {
      tasks[taskIndex].disabled = updates.disabled;
    }
    if (updates.priority !== undefined) {
      tasks[taskIndex].priority = updates.priority;
    }

    const tasksJson = JSON.stringify(tasks);
    context.log('Updating tasks:', tasksJson);
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
      },
      body: tasks[taskIndex],
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
      },
      body: `Error updating task: ${error.message}`,
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
