import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../actions/session";
import msitLogo from "../assets/msit.png";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Read user from Redux session slice
  const currentUser = useSelector((state) => state.session);
  console.log("currentUser" , currentUser);
  

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <header>
      {/* Top Section with Logo & Heading */}
      <div className="bg-gray-100 p-4 flex items-center justify-between shadow-md">
        <Link to="/">
          <img
            src={msitLogo}
            alt="MSIT logo"
            className="h-16 w-auto ml-4 cursor-pointer"
          />
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-700">
            MAHARAJA SURAJMAL INSTITUTE OF TECHNOLOGY
          </h1>
          <p className="text-orange-600 text-sm">
            Affiliated to GGSIPU | NAAC Accredited 'A' Grade | NBA (CSE, IT,
            ECE, EEE) | Approved by AICTE | ISO 9001:2015 Certified
          </p>
        </div>

        <div className="mr-4">
          <p className="text-gray-700 font-medium text-sm">
            An initiative by MSIT for seamless faculty services.
          </p>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-blue-900 p-3 shadow-md">
        <div className="container mx-auto flex justify-between space-x-6">
          <Link to="/" className="text-white hover:underline">
            Home
          </Link>
          <Link to="/about" className="text-white hover:underline">
            About Us
          </Link>
          <Link to="/holiday-calendar" className="text-white hover:underline">
            Holiday Calendar
          </Link>
          <Link to="/leave-info" className="text-white hover:underline">
            Leave Info
          </Link>
          <Link to="/contact" className="text-white hover:underline">
            Contact Us
          </Link>

          {/* Login → Logout Toggle */}
          {!currentUser ? (
            <Link to="/login" className="text-white hover:underline">
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="text-white hover:underline"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
