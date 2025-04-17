import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { logout , receiveCurrentUser } from "../actions/session";

// <-- REMOVE IN PRODUCTION
const isBypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";
// -->

export const AuthRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session.userId));
  const location = useLocation();

  if (loggedIn && !isBypassAuth) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export const ProtectedRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session.userId));
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  const validateSession = async () => {
    console.log(isBypassAuth);
    
    // <-- REMOVE IN PRODUCTION
    if (isBypassAuth) {
      setChecking(false);
      return;
    }
    // -->

    try {
      const res = await fetch("/api/session", {
        credentials: "include", // send cookies
      });
      const data = await res.json();

      if (res.ok && data.user) {
        dispatch(receiveCurrentUser(data.user));
      } else {
        dispatch(logout());
      }
    } catch (err) {
      dispatch(logout());
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Initial session check
    setChecking(true);
    validateSession();

  }, [location.pathname,dispatch]);

  if (checking) return <div>Loading...</div>;

  if (!loggedIn) {
    console.log(loggedIn);
    
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};



export default { AuthRoute, ProtectedRoute };
