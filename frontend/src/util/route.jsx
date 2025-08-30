import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { logout, receiveCurrentUser } from "../actions/session";

export const AuthRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session.user_id));
  const location = useLocation();

  if (loggedIn) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export const ProtectedRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session.user_id));
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  const validateSession = async () => {
    try {
      const res = await fetch("/api/session", {
        credentials: "include",
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
    setChecking(true);
    validateSession();
  }, [location.pathname, dispatch]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Checking session...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default { AuthRoute, ProtectedRoute };
