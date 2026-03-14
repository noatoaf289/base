const buildAuthHeaders = ({ apiKey, user, password }) => {
  if (apiKey) {
    return { Authorization: `Bearer ${apiKey}` };
  }

  if (user && password) {
    const encoded = Buffer.from(`${user}:${password}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }

  return {};
};

const postJson = async ({ url, body, headers = {} }) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { response, text, json };
};

export { buildAuthHeaders, postJson };
