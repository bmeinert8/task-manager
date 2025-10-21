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
      // 404 means no tasks.json, so no tasks to delete
      context.res = {
        status: 404,
        body: 'No tasks found',
      };
      return;
    }

    // Find and remove task
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      context.res = {
        status: 404,
        body: `Task with ID ${taskId} not found`,
      };
      return;
    }

    // Remove task
    tasks.splice(taskIndex, 1);

    // Write updated tasks back to Blob
    const tasksJson = JSON.stringify(tasks);
    context.log('Updating tasks after deletion:', tasksJson); // Debug log
    await blobClient.uploadData(Buffer.from(tasksJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 200,
      body: { message: `Task with ID ${taskId} deleted successfully` },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error deleting task: ${error.message}`,
    };
    context.log.error('Error in deleteTask:', error);
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
