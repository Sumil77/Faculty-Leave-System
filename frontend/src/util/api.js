export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    // Try parsing JSON, fallback to text
    let data;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch {
      data = null;
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage =
        (data && data.message) ||
        (typeof data === "string" ? data : null) ||
        `Error ${response.status}: ${response.statusText}`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Error [${options.method || "GET"} ${url}]`, error);
    throw error; // Bubble up so component can show toast/UI message
  }
};
