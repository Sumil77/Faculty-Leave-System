import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";

function App() {
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
