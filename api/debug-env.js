// Temporary diagnostic endpoint — confirms env vars are present without
// exposing their actual values. Delete this file once auth is working.
module.exports = (req, res) => {
  const id = process.env.GITHUB_CLIENT_ID || "";
  const secret = process.env.GITHUB_CLIENT_SECRET || "";
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    clientIdPresent: !!id,
    clientIdLength: id.length,
    clientIdPreview: id.slice(0, 4) + "..." + id.slice(-4),
    clientSecretPresent: !!secret,
    clientSecretLength: secret.length,
    clientSecretHasWhitespace: /\s/.test(secret),
    clientSecretPreview: secret.slice(0, 4) + "..." + secret.slice(-4),
  }));
};
