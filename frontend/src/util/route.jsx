import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { logout , receiveCurrentUser } from "../actions/session";

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
  const [checking, setChecking] = useState(true);

  const checkInterval = 10 * 1000; // 5 minutes
  const idleTimeout = 20 * 1000; // 10 minutes of inactivity

  let idleTimer;

  const validateSession = async () => {
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

  // Reset idle timer on mouse click (or any other event like key press, scroll, etc.)
  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      validateSession(); // Trigger session check after inactivity timeout
    }, idleTimeout);
  };

  useEffect(() => {
    // Initial session check
    validateSession();

    // Set interval to check session every checkInterval time
    const intervalId = setInterval(() => {
      validateSession();
    }, checkInterval);

    // Set event listener for mouse clicks
    window.addEventListener("click", resetIdleTimer);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("click", resetIdleTimer); // Remove event listener on cleanup
    };
  }, [dispatch]);

  if (checking) return <div>Loading...</div>;

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};



export default { AuthRoute, ProtectedRoute };
