const Footer = () => {
    return (
      <footer className="bg-gray-900 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-6 md:space-y-0">
          
          {/* Policies */}
          <div>
            <h2 className="text-lg font-semibold">Policies</h2>
            <a href="/leave-policy" className="text-sm hover:underline block">Leave Policy</a>
            <a href="/terms" className="text-sm hover:underline block">Terms & Conditions</a>
          </div>
          
          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold">Contact Us</h2>
            <p className="text-sm">MSIT, New Delhi, India</p>
            <p className="text-sm">
              Email: <a href="mailto:info@faculty-leave.com" className="underline">info@faculty-leave.com</a>
            </p>
          </div>

          {/* Developed By */}
          <div>
            <h2 className="text-lg font-semibold">Developed By</h2>
            <p className="text-sm">MAHA-DEV</p>
          </div>
  
        </div>
      </footer>
    );
  };
  
export default Footer;
