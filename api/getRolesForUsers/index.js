module.exports = async function (context, req) {
  const header = req.headers['x-ms-client-principal'];
  if (!header) {
    context.res = {
      status: 401,
      body: JSON.stringify({ roles: [] }),
    };
    return;
  }

  const decoded = Buffer.from(header, 'base64').toString('utf8');
  const client = JSON.parse(decoded);

  // Example: everyone authenticated gets "authenticated" role
  context.res = {
    status: 200,
    body: JSON.stringify({
      roles: ['authenticated'],
    }),
    headers: { 'Content-Type': 'application/json' },
  };
};
