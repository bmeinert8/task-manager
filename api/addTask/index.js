const { BlobServiceClient } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
    return;
  }

  try {
    const newTask = req.body;
    if (!newTask || !newTask.text || typeof newTask.text !== 'string') {
      context.res = {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
        },
        body: 'Invalid task: text is required and must be a string',
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
    }

    const task = {
      id: randomUUID(),
      text: newTask.text,
      disabled: newTask.disabled || false,
      priority: newTask.priority || false,
      createdDate:
        newTask.createdDate || new Date().toISOString().split('T')[0],
    };
    tasks.push(task);

    const tasksJson = JSON.stringify(tasks);
    context.log('Uploading tasks:', tasksJson);
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
      },
      body: task,
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
      },
      body: `Error adding task: ${error.message}`,
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
