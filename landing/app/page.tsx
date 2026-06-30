import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GetAppBtn from "./components/GetAppBtn";
import FaqItem from "./components/FaqItem";
import ServicesShowcase from "./components/ServicesShowcase";

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
                <li>
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions">Terms</Link>
                </li>
                <li>
                  <Link href="/privacy-policy">Privacy</Link>
                </li>
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
              <h1>
                Go anywhere,
                <br /> grab anything.
              </h1>
              <p>
                The all-in-one app for reliable rides and swift package
                deliveries. Experience seamless transportation and logistics at
                your fingertips.
              </p>

              <div className="download-buttons">
                <a
                  href="https://apps.apple.com/ng/app/igle/id6760672863"
                  target="_blank"
                  className="store-btn"
                >
                  <svg viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <div className="store-text">
                    <span>Download on the</span>
                    <span>App Store</span>
                  </div>
                </a>

                <a
                  href="https://play.google.com/store/apps/details?id=com.lawrencejr.igle"
                  target="_blank"
                  className="store-btn"
                >
                  <svg viewBox="0 0 512 512" fill="currentColor">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                  </svg>
                  <div className="store-text">
                    <span>GET IT ON</span>
                    <span>Google Play</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="hero-mockup">
              <div className="mockup-bg"></div>
              <img
                src="/images/home-screenshot.png"
                alt="Igle App Mockup"
                className="mockup-img"
              />
              <img
                src="/images/map-screenshot.png"
                alt="Igle Map"
                className="mockup-img-secondary"
              />
            </div>
          </div>
        </section>

        <ServicesShowcase />

        <section className="benefits-section" id="benefits">
          <div className="container">
            <div className="section-header text-center">
              <span className="badge-pill">Why Igle</span>
              <h2>Designed with your safety and comfort in mind</h2>
              <p className="section-subtitle">
                We are building the future of urban movement. Here is why thousands of riders and businesses choose Igle daily.
              </p>
            </div>

            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3>Safety First, Always</h3>
                <p>
                  Every driver is vetted, trips are tracked in real-time, and in-app SOS buttons are available to ensure peace of mind.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3>Transparent Pricing</h3>
                <p>
                  No surprises or hidden fees. Get your upfront fare estimate before booking, so you always know what you will pay.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3>Rapid Dispatch</h3>
                <p>
                  Our advanced smart-routing algorithms match you with the closest vehicle instantly, slashing your wait times.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                    <polyline points="2 17 12 22 22 17"/>
                    <polyline points="2 12 12 17 22 12"/>
                  </svg>
                </div>
                <h3>Versatile Fleet</h3>
                <p>
                  From budget-friendly Kekes to premium SUVs, and dispatch bikes to heavy trucks, we support all your transport needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works-section" id="how-it-works">
          <div className="container">
            <div className="section-header text-center">
              <span className="badge-pill">How It Works</span>
              <h2>Getting started in 3 simple steps</h2>
              <p className="section-subtitle">
                Download the app, set up your profile, and you are ready to book rides or send packages in seconds.
              </p>
            </div>

            <div className="steps-container">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Select & Enter Details</h3>
                <p>Choose ride-hailing or delivery, then enter your pickup and destination locations.</p>
              </div>
              <div className="step-card-connector"></div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Choose Vehicle & Confirm</h3>
                <p>Select the vehicle that fits your budget or parcel size, review the upfront price, and book.</p>
              </div>
              <div className="step-card-connector"></div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Track Real-time & Arrive</h3>
                <p>Watch your driver or dispatcher move on the map, receive updates, and complete payment.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="partners-section" id="partners">
          <div className="container">
            <div className="partners-grid">
              <div className="partner-card">
                <div className="partner-image-bg" style={{ backgroundImage: "url('/images/boy-girl-pose.jpg')" }}>
                  <div className="image-overlay"></div>
                </div>
                <div className="partner-content">
                  <span className="partner-badge">Earn on Your Terms</span>
                  <h2>Drive and earn with Igle</h2>
                  <p>
                    Turn your Keke, Cab, or SUV into a source of income. Sign up today to start taking rides on your own schedule, with weekly payouts and full support.
                  </p>
                  <a href="https://play.google.com/store/apps/details?id=com.lawrencejr.igle" target="_blank" className="btn-pill white-btn">
                    Become a Driver
                  </a>
                </div>
              </div>

              <div className="partner-card">
                <div className="partner-image-bg" style={{ backgroundImage: "url('/images/delivery-girl.jpg')" }}>
                  <div className="image-overlay"></div>
                </div>
                <div className="partner-content">
                  <span className="partner-badge">Business & Fleet</span>
                  <h2>Deliver with Igle</h2>
                  <p>
                    Have a dispatch bike, van, or delivery truck? Register with our logistics network to fulfill package deliveries across town and scale your fleet.
                  </p>
                  <a href="https://play.google.com/store/apps/details?id=com.lawrencejr.igle" target="_blank" className="btn-pill white-btn">
                    Register as Partner
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="app-showcase-section" id="download">
          <div className="container app-showcase-container">
            <div className="app-showcase-images">
              <img src="/images/3-app-screens.png" alt="Igle App Screens" className="screens-img" />
            </div>
            
            <div className="app-showcase-content">
              <span className="badge-pill">Download Igle</span>
              <h2>All your transport and delivery needs in one app</h2>
              <p className="app-description">
                Experience a new level of convenience. Book safe rides, deliver packages, and manage your trips all from your mobile phone.
              </p>

              <div className="showcase-features">
                <div className="showcase-feature-item">
                  <div className="feature-dot"></div>
                  <div>
                    <h4>Multiple Payment Options</h4>
                    <p>Pay securely with card, bank transfer, mobile wallet, or cash.</p>
                  </div>
                </div>
                <div className="showcase-feature-item">
                  <div className="feature-dot"></div>
                  <div>
                    <h4>Live Tracking</h4>
                    <p>Track your rides and package deliveries in real-time from start to destination.</p>
                  </div>
                </div>
                <div className="showcase-feature-item">
                  <div className="feature-dot"></div>
                  <div>
                    <h4>Scheduled Rides</h4>
                    <p>Schedule a ride for anytime in advance to make sure you never run late.</p>
                  </div>
                </div>
              </div>

              <div className="download-buttons">
                <a href="https://apps.apple.com/ng/app/igle/id6760672863" target="_blank" className="store-btn">
                  <svg viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <div className="store-text">
                    <span>Download on the</span>
                    <span>App Store</span>
                  </div>
                </a>

                <a href="https://play.google.com/store/apps/details?id=com.lawrencejr.igle" target="_blank" className="store-btn">
                  <svg viewBox="0 0 512 512" fill="currentColor">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                  </svg>
                  <div className="store-text">
                    <span>GET IT ON</span>
                    <span>Google Play</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="container">
            <div className="section-header text-center">
              <span className="badge-pill">FAQ</span>
              <h2>Frequently Asked Questions</h2>
              <p className="section-subtitle">Got questions? We have answers. Find out how Igle works for riders, senders, and partners.</p>
            </div>
            
            <div className="faq-list">
              <FaqItem
                question="How do I book a ride with Igle?"
                answer="Simply open the Igle app, enter your destination, choose your ride preference (Keke, Cab, or SUV), review the upfront fare estimate, and tap 'Confirm'. We'll immediately match you with the nearest driver."
              />
              <FaqItem
                question="What payment methods do you accept?"
                answer="Igle is highly flexible. You can pay securely using debit/credit cards, direct bank transfer, your in-app Igle wallet, or by paying cash directly to the driver or courier."
              />
              <FaqItem
                question="Can I track my package delivery in real-time?"
                answer="Yes! As soon as your dispatch courier picks up the package (whether on a bike, cab, or van), you will see their live GPS location on the map. You can also share the tracking link with the receiver."
              />
              <FaqItem
                question="Are Igle deliveries and rides safe?"
                answer="Absolutely. All Igle drivers and dispatchers undergo rigorous vetting, background checks, and vehicle inspections. Our app also features real-time GPS tracking, ride sharing features, and an in-app emergency button."
              />
              <FaqItem
                question="How do I sign up to drive or deliver and earn money?"
                answer="Simply download the main Igle app from the App Store or Play Store, open the side navigation menu, and tap 'Become a Driver'. From there, select your vehicle type, fill in your driver and vehicle details, and submit. Our onboarding team will review your application and approve it within three days."
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
              &copy; {new Date().getFullYear()} Omyann Technologies Ltd. All
              rights reserved.
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
