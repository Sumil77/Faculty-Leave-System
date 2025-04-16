import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { checkLoggedIn } from "../util/session.js";
import { receiveCurrentUser, logout } from "../actions/session.js"; // adjust path if needed

const ProtectedRoute = ({ redirectPath = "/login", children }) => {
  const isLoggedIn = useSelector((state) => Boolean(state.session?.userId));
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const verifySession = async () => {
      const sessionState = await checkLoggedIn();
      if (sessionState.session) {
        dispatch(receiveCurrentUser(sessionState.session));
      } else {
        dispatch(logout());
      }
      setChecking(false);
    };

    verifySession();
  }, [dispatch]);

  if (checking) return <div>Checking session...</div>;

  if (!isLoggedIn) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
