// Step 2 of the GitHub OAuth handshake for Decap CMS.
// GitHub redirects here with a ?code=... which we exchange for an
// access token, then hand back to the CMS popup via postMessage.
module.exports = async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get("code");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await tokenRes.json();

  if (data.error || !data.access_token) {
    res.statusCode = 400;
    res.end(`Auth error: ${data.error_description || data.error || "unknown error"}`);
    return;
  }

  const payload = JSON.stringify({ token: data.access_token, provider: "github" });

  res.setHeader("Content-Type", "text/html");
  res.end(`<script>
    (function() {
      function receiveMessage(message) {
        window.opener.postMessage(
          'authorization:github:success:${payload}',
          message.origin
        );
        window.removeEventListener('message', receiveMessage, false);
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  </script>`);
};
