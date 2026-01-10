import type { Metadata } from "next";
import Image from "next/image";
import GetAppBtn from "./components/GetAppBtn";
import FaqItem from "./components/FaqItem";

export const metadata: Metadata = {
  title: "Igle - Ride Hailing & Package Delivery",
  description:
    "The all-in-one app for reliable rides and swift package deliveries. Download Igle today.",
};

export default function Home() {
  return (
    <div className="wrapper">
      {/* Navigation */}
      <header>
        <div className="container">
          <nav>
            {/* Left: Logo Image */}
            <a href="/" className="logo">
              {/* standard img tag to avoid next/image complexity */}
              <img src="/images/igle-white.png" alt="Igle Logo" />
            </a>

            {/* Right: Nav Links + Button */}
            <div className="nav-actions">
              <ul className="nav-links">
                <li>
                  <a href="/about">About Igle</a>
                </li>
                <li>
                  <a href="/terms-and-conditions">Terms & Conditions</a>
                </li>
                <li>
                  <a href="/privacy-policy">Privacy Policy</a>
                </li>
              </ul>
              <GetAppBtn />
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* Banner / Hero Section */}
        <section className="hero">
          <div className="container">
            <h1>
              Move Better.
              <br />
              Deliver Faster.
            </h1>
            <p>
              Experience the seamless way to get around town or send packages to
              loved ones. Reliable, safe, and just one tap away.
            </p>

            <div className="download-buttons">
              {/* Apple Store Button */}
              <a
                href="https://apps.apple.com/app/igle/id6471822837"
                target="_blank"
                className="btn"
              >
                <img
                  src="/icons/apple.png"
                  alt="appstore icon"
                  width={"20px"}
                  height={"20px"}
                />
                App Store
              </a>

              {/* Google Play Button */}
              <a
                href="https://play.google.com/store/apps/details?id=com.lawrencejr.igle"
                target="_blank"
                className="btn btn-outline"
              >
                <img
                  src="/icons/google-play.png"
                  alt="playstore icon"
                  width={"20px"}
                  height={"20px"}
                />{" "}
                Google Play
              </a>
            </div>

            {/* Placeholder for App Screenshot */}
            <div className="hero-image"></div>
          </div>
        </section>
        {/* Services Section */}
        <section className="services">
          <div className="container">
            <div className="section-header">
              <h2>
                Everything you need,
                <br /> delivered.
              </h2>
              <p className="subtitle">
                Whether it's moving yourself or moving your things, we've got
                you covered.
              </p>
            </div>

            <div className="service-grid">
              {/* Service 1: Ride Hailing */}
              <div className="service-card">
                <div className="card-image">
                  {/* Replace with your actual image later */}
                  <img
                    src="/images/service-ride.jpg"
                    alt="Ride Hailing Service"
                  />
                </div>
                <div className="card-content">
                  <h3>Ride Hailing</h3>
                  <p>
                    Commute with confidence. From budget-friendly rides to
                    premium comfort, get to your destination safely and on time.
                  </p>
                  <a href="#" className="text-link">
                    Book a ride &rarr;
                  </a>
                </div>
              </div>

              {/* Service 2: Package Delivery */}
              <div className="service-card">
                <div className="card-image">
                  {/* Replace with your actual image later */}
                  <img
                    src="/images/service-delivery.jpg"
                    alt="Package Delivery Service"
                  />
                </div>
                <div className="card-content">
                  <h3>Package Delivery</h3>
                  <p>
                    Send packages across town in minutes. Real-time tracking,
                    secure handling, and proof of delivery right on your phone.
                  </p>
                  <a href="#" className="text-link">
                    Send a package &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq">
          <div className="container">
            <h2>Frequently Asked Questions</h2>

            <FaqItem
              question="How do I book a ride?"
              answer="Simply open the Igle app, enter your destination, choose your ride preference, and confirm. A driver will be with you shortly."
            />

            <FaqItem
              question="Is package delivery insured?"
              answer="Yes, all packages sent through Igle are insured up to a certain value to ensure your items are safe. You can view the insurance policy in the app settings."
            />

            <FaqItem
              question="What payment methods are accepted?"
              answer="We accept all major credit cards, debit cards, and cash payments. You can also securely save your card details for faster checkout."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="brand">
              <h3>Igle.</h3>
              <p>Ride & Deliver.</p>
            </div>
            <div className="footer-links">
              <a href="/about">About Us</a>
              <a href="/terms-and-conditions">Privacy Policy</a>
              <a href="/privacy-policy">Terms & Conditions</a>
            </div>
          </div>
          <div className="copyright">
            &copy; {new Date().getFullYear()} Igle Technologies. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
