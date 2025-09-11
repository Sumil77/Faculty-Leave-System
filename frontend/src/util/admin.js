// src/util/user.js
import { apiRequest } from "./api.js";

export const dept = ["CSE", "ECE", "ME", "EEE"];

export const getUsers = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  return apiRequest(`/api/admin/getUsers?${queryString}`, { method: "GET" });
};

export const postUser = async (user) => {
  return apiRequest("/api/admin/postUser", {
    method: "POST",
    body: user,
  });
};

export const patchUser = async (user) => {
  return apiRequest("/api/admin/patchUser", {
    method: "PATCH",
    body: user,
  });
};

export const deleteUsers = async (ids) => {
  console.log(ids);

  return apiRequest("/api/admin/deleteUsers", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(ids),
  });
};

export const getLeaves = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  return apiRequest(`/api/admin/leaves?${queryString}`, { method: "GET" });
};

export const downloadReport = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  return apiRequest(`/api/admin/downloadReport?${queryString}`, {
    method: "GET",
    responseType: "blob", // special: expect file blob
  });
};

export const mailReport = async (filters = {}) => {
  return apiRequest("/api/admin/mailReport", {
    method: "POST",
    body: JSON.stringify(filters),
  });
};
