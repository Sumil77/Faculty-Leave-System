import { apiRequest } from "./api.js";

export const signup = (user) => {
  return apiRequest("/api/users", {
    method: "POST",
    body: user,
  });
};

export const login = (user) => {
  return apiRequest("/api/session", {
    method: "POST",
    body: user,
  });
};

export const logout = () => {
  return apiRequest("/api/session", {
    method: "DELETE",
  });
};


// export const checkLoggedIn = async (preloadedState) => {
//   const response = await fetch("/api/session");
//   const { user } = await response.json();
//   if (user) {
//     preloadedState = {
//       session: user,
//     };
//   }
//   return preloadedState;
// };
