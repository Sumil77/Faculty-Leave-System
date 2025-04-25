// src/components/AuthRoute.jsx
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AuthRoute = ({ redirectPath = "/dashboard", children }) => {
  const isLoggedIn = useSelector((state) => Boolean(state.session.user_id));
  const location = useLocation();

  if (isLoggedIn) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default AuthRoute;
