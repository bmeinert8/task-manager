const { BlobServiceClient } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');

module.exports = async function (context, req) {
  try {
    // Validate request body
    const newTask = req.body;
    if (!newTask || !newTask.text || typeof newTask.text !== 'string') {
      context.res = {
        status: 400,
        body: 'Invalid task: text is required and must be a string',
      };
      return;
    }

    // Initialize BlobServiceClient
    const connectionString = process.env.AzureWebJobsStorage;
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('tasks');
    const blobClient = containerClient.getBlockBlobClient('tasks.json');

    // Read existing tasks
    let tasks = [];
    try {
      const downloadResponse = await blobClient.download();
      const tasksJson = await streamToText(downloadResponse.readableStreamBody);
      tasks = JSON.parse(tasksJson || '[]');
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error; // Rethrow non-404 errors
      }
      // 404 means no tasks.json yet, start with empty array
    }

    // Add new task with ID and defaults
    const task = {
      id: randomUUID(), // Generate unique ID
      text: newTask.text,
      disabled: newTask.disabled || false,
      priority: newTask.priority || false,
      createdDate:
        newTask.createdDate || new Date().toISOString().split('T')[0],
    };
    tasks.push(task);

    // Convert tasks to JSON string and upload
    const tasksJson = JSON.stringify(tasks);
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 201,
      body: task, // Return the added task
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error adding task: ${error.message}`,
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
