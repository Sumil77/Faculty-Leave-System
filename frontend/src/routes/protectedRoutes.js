import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { checkLoggedIn } from "../util/session.js";
import { receiveCurrentUser, logout } from "../actions/session.js"; // adjust path if needed

export const ProtectedRoute = ({ children }) => {
  const loggedIn = useSelector((state) => Boolean(state.session?.user_id));
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const data = await apiRequest("/api/session", { method: "GET" });
        if (data?.user_id) {
          dispatch(receiveCurrentUser(data));
        }
      } catch {
        dispatch(logout());
      } finally {
        setChecking(false);
      }
    };
    validateSession();
  }, [dispatch]);

  if (checking) return <div>Checking session...</div>;
  if (!loggedIn) return <Navigate to="/login" replace />;
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
