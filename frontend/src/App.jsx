import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchGlobals } from "./store/global.js";


function App() {
  const dispatch = useDispatch();
  const lastFetched = useSelector((s) => s.global.lastFetched);

  useEffect(() => {
    const now = Date.now();
    if (!lastFetched || now - lastFetched > 30 * 60 * 1000) {
      dispatch(fetchGlobals());
    }
  }, [dispatch, lastFetched]);
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar (one component handles both mobile & desktop) */}
        <Sidebar />

        {/* Main Page Content */}
        <main className="flex-1 p-5 overflow-y-auto bg-gray-50">
          <AppRoutes />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
