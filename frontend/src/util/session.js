export const signup = user => (
    fetch("api/users", {
      method: "POST",
      body: JSON.stringify(user),
      headers: {
        "Content-Type": "application/json"
      },
    })
  );
  export const login = user => (
    fetch("api/session", {
      method: "POST",
      body: JSON.stringify(user),
      headers: {
        "Content-Type": "application/json"
      },
    })
);
export const logout = async () => {
  const response = await fetch("/api/session", {
    method: "DELETE",
    credentials: "include", // Include cookies for session
  });
  return response;
};


  export const checkLoggedIn = async preloadedState => {
    const response = await fetch('/api/session');
    const { user } = await response.json();
    if (user) {
      preloadedState = {
        session: user
      };
    }
    return preloadedState;
  };