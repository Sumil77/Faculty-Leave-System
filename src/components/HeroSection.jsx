import { useEffect, useRef } from "react";
import Typed from "typed.js";

const HeroSection = () => {
  const typedRef = useRef(null);

  useEffect(() => {
    const typed = new Typed(typedRef.current, {
      strings: [
        "Apply & Track Leave Requests",
        "Real-time Leave Status Updates",
        "Approval Workflow for Admins",
        "Leave Balance & History Overview",
        "Department-Wide Leave Calendar",
      ],
      loop: true,
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 800,
    });

    return () => {
      typed.destroy();
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-cyan-950 text-white py-16 px-4 text-center">
        <div className="container mx-auto">
          {/* Dynamic Typing Effect */}
          <h2 className="text-xl md:text-3xl font-semibold">
            <span ref={typedRef}></span>
          </h2>
          <p className="text-sm md:text-lg mt-4 mb-6">
            Apply, track, and manage your leaves with ease – a seamless solution for faculty members.
          </p>
        </div>
      </section>

    {/* Image Section */}
<section className="py-8 bg-gray-100 flex justify-center">
  <img 
    src="/src/assets/Visual.png" 
    alt="Faculty Leave Management" 
    className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl"
  />
</section>

    </>
  );
};

export default HeroSection;
