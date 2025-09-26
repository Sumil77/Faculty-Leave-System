import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { logout, receiveCurrentUser } from "../actions/session";
import { apiRequest } from "../util/api";

export const ProtectedRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session?.user_id));
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const data = await apiRequest("/api/session", { method: "GET" });
        console.log("SESSION RESPONSE:", data); // <--- inspect this

        // adjust depending on your backend response
        const user = data?.user || data?.session || data;

        if (user?.user_id) {
          dispatch(receiveCurrentUser(user));
        } else {
          dispatch(logout());
        }
      } catch (err) {
        console.error("SESSION ERROR:", err);
        dispatch(logout());
      } finally {
        setChecking(false);
      }
    };
    validateSession();
  }, [dispatch]);


  if (checking) return <div>Checking session...</div>; // wait until session is validated
  if (!loggedIn) return <Navigate to="/login" replace />;

  return children ? children : <Outlet />;
};


export const AuthRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session?.user_id));
  if (loggedIn) return <Navigate to="/dashboard" replace />;
  return children ? children : <Outlet />;
};


export default { ProtectedRoute, AuthRoute };
