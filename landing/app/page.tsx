import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
      <header>
        <div className="container">
          <nav>
            <Link href="/" className="logo">
              <img src="/images/logo.png" alt="Igle Logo" />
              <span className="logo-text">Igle.</span>
            </Link>

            <div className="nav-actions">
              <ul className="nav-links">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/terms-and-conditions">Terms</Link></li>
                <li><Link href="/privacy-policy">Privacy</Link></li>
              </ul>
              <GetAppBtn />
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-container">
            <div className="hero-content">
              <h1>Go anywhere,<br /> grab anything.</h1>
              <p>The all-in-one app for reliable rides and swift package deliveries. Experience seamless transportation and logistics at your fingertips.</p>

              <div className="download-buttons">
                <a href="https://apps.apple.com/app/igle/id6471822837" target="_blank" className="store-btn">
                  <svg viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  <div className="store-text">
                    <span>Download on the</span>
                    <span>App Store</span>
                  </div>
                </a>

                <a href="https://play.google.com/store/apps/details?id=com.lawrencejr.igle" target="_blank" className="store-btn">
                  <svg viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                  <div className="store-text">
                    <span>GET IT ON</span>
                    <span>Google Play</span>
                  </div>
                </a>
              </div>
            </div>
            
            <div className="hero-mockup">
               <div className="mockup-bg"></div>
               <img src="/images/home-screenshot.png" alt="Igle App Mockup" className="mockup-img" />
               <img src="/images/map-screenshot.png" alt="Igle Map" className="mockup-img-secondary" />
            </div>
          </div>
        </section>

        <section className="feature-row">
          <div className="container feature-container">
            <div className="feature-text">
              <h2>Request a ride</h2>
              <p>Commute with confidence. Fast, reliable, and comfortable rides at your fingertips. Wherever you're going, Igle connects you to the best drivers in your city.</p>
              <Link href="#" className="btn-pill">Get a ride</Link>
            </div>
            <div className="feature-image">
              <img src="/images/service-ride.jpg" alt="Ride Service" />
            </div>
          </div>
        </section>

        <section className="feature-row reverse">
          <div className="container feature-container">
            <div className="feature-text">
              <h2>Send packages across town</h2>
              <p>Need something delivered ASAP? From documents to groceries, send packages across town in minutes with real-time tracking from pickup to drop-off.</p>
              <Link href="#" className="btn-pill">Send a package</Link>
            </div>
            <div className="feature-image">
               <img src="/images/delivery-guy.jpg" alt="Package Delivery" />
            </div>
          </div>
        </section>

        <section className="feature-row">
          <div className="container feature-container">
            <div className="feature-text">
              <h2>Earn money on your terms</h2>
              <p>Join our community of drivers and couriers. Drive with Igle and earn on your schedule. Enjoy flexible hours, instant payouts, and the freedom to be your own boss.</p>
              <Link href="#" className="btn-pill">Sign up to drive</Link>
            </div>
            <div className="feature-image">
              <img src="/images/keke-guy.jpg" alt="Driver" />
            </div>
          </div>
        </section>

        <section className="faq">
          <div className="container">
            <div className="faq-header">
              <h2>Frequently Asked Questions</h2>
            </div>
            <div className="faq-list">
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
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="brand">
              <div className="footer-logo">Igle.</div>
              <p>Move Better. Deliver Faster.</p>
            </div>
            <div className="footer-links-group">
                <div className="footer-col">
                    <h4>Igle</h4>
                    <Link href="/about">About Us</Link>
                    <Link href="/careers">Careers</Link>
                    <Link href="/cities">Cities</Link>
                </div>
                <div className="footer-col">
                    <h4>Partner with us</h4>
                    <Link href="/drive">Sign up as a driver</Link>
                    <Link href="/fleet">Fleet registration</Link>
                    <Link href="/merchants">Merchants</Link>
                </div>
                <div className="footer-col">
                    <h4>Legal</h4>
                    <Link href="/terms-and-conditions">Terms</Link>
                    <Link href="/privacy-policy">Privacy</Link>
                </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="copyright">
              &copy; {new Date().getFullYear()} Omyann Technologies Ltd. All rights reserved.
            </div>
            <div className="socials">
              <a href="#">Instagram</a>
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
