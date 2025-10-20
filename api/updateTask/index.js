const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  try {
    // Get task ID from route parameter
    const taskId = context.bindingData.id;
    if (!taskId) {
      context.res = {
        status: 400,
        body: 'Task ID is required in the URL',
      };
      return;
    }

    // Validate request body
    const updates = req.body;
    if (
      !updates ||
      (updates.disabled === undefined && updates.priority === undefined)
    ) {
      context.res = {
        status: 400,
        body: 'At least one of disabled or priority must be provided',
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
        throw error;
      }
      // 404 means no tasks.json, so no tasks to update
      context.res = {
        status: 404,
        body: 'No tasks found',
      };
      return;
    }

    // Find and update task
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      context.res = {
        status: 404,
        body: `Task with ID ${taskId} not found`,
      };
      return;
    }

    // Update only provided fields
    if (updates.disabled !== undefined) {
      tasks[taskIndex].disabled = updates.disabled;
    }
    if (updates.priority !== undefined) {
      tasks[taskIndex].priority = updates.priority;
    }

    // Write updated tasks back to Blob
    const tasksJson = JSON.stringify(tasks);
    context.log('Updating tasks:', tasksJson); // Debug log
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 200,
      body: tasks[taskIndex], // Return updated task
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error updating task: ${error.message}`,
    };
    context.log.error('Error in updateTask:', error);
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
