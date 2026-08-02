// Step 1 of the GitHub OAuth handshake for Decap CMS.
// Redirects the CMS's popup window to GitHub's authorize page.
module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const host = req.headers.host;
  const redirectUri = `https://${host}/api/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,user",
    state: "decap-cms",
  });

  res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params.toString()}` });
  res.end();
};
