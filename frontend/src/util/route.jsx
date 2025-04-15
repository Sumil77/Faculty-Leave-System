import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { logout } from "../actions/session";

export const AuthRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session.userId));
  const location = useLocation();

  if (loggedIn) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export const ProtectedRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session.userId));
  const dispatch = useDispatch();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const res = await fetch("/api/session", {
          credentials: "include",
        });
        const data = await res.json();
        console.log("✅ Session Check Response:", data); //
        
        if (res.ok && data.user) {
          dispatch(receiveCurrentUser(data.user));
        } else {
          console.log("why")
          dispatch(logout());
        }
      } catch (err) {
        console.log(err);
        
        dispatch(logout());
      } finally {
        setChecking(false);
      }
    };

    validateSession();
  }, [dispatch]);

  if (checking) return null; // or show loader

  if (!loggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default { AuthRoute, ProtectedRoute };
