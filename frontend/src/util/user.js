import { apiRequest } from "./api.js";

export const getUser = () => {
  return apiRequest("/api/users/me", {
    method: "GET",
  });
};
