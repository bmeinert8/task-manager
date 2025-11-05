module.exports = async function (context, req) {
  try {
    const header = req.headers['x-ms-client-principal'];
    if (!header) {
      context.res = { status: 401, body: 'Unauthorized' };
      return;
    }

    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    const principal = JSON.parse(decoded);

    // Basic validation: Ensure user is authenticated (principal exists)
    if (!principal || !principal.userId) {
      context.res = { status: 401, body: 'Unauthorized' };
      return;
    }

    // For now, assign "authenticated" role to any valid user
    // Later, check Entra ID claims/groups/scopes for custom roles (SC-300 skill)
    const roles = ['authenticated'];

    context.res = {
      status: 200,
      body: { roles }
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error assigning roles: ${error.message}`
    };
  }
};