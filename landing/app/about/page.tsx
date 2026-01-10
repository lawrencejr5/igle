import Image from "next/image";
import Link from "next/link";
import styles from "../styles/About.module.scss";
import Head from "next/head";
import FaqItem from "../components/FaqItem";

const About = () => {
  return (
    <>
      <Head>
        <title>About Us | Igle</title>
        <meta
          name="description"
          content="Learn more about Igle, the app moving people and packages safely."
        />
      </Head>

      <main className={styles.container}>
        <div className={styles.wrapper}>
          {/* Header (Same as Privacy Policy) */}
          <header className={styles.header}>
            <div className={styles.topNav}>
              <Link href="/" className={styles.backButton}>
                ← Back to Home
              </Link>
            </div>

            <div className={styles.mainHeaderRow}>
              <div className={styles.brand}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    src="/images/logo.png"
                    alt="Igle Logo"
                    width={60}
                    height={60}
                    priority
                    style={{ objectFit: "contain", borderRadius: "10px" }}
                  />
                </div>
                <span className={styles.appName}>Igle</span>
              </div>

              <div className={styles.titleSection}>
                <h1>About Us</h1>
                <p className={styles.subtitle}>
                  Redefining mobility in our cities.
                </p>
              </div>
            </div>
          </header>

          {/* Hero Statement */}
          <section className={styles.heroText}>
            <p>
              We believe that moving around your city shouldn't be a hassle.
              Whether you are catching a ride to a meeting or sending a package
              to a loved one,
              <strong>
                {" "}
                Igle is built to make the journey safe, seamless, and reliable.
              </strong>
            </p>
          </section>

          {/* What We Do */}
          <section className={styles.section}>
            <h2>What We Do</h2>
            <div className={styles.grid}>
              <div className={styles.card}>
                <h3>🚗 Ride Hailing</h3>
                <p>
                  Connect with verified drivers in minutes. No more standing by
                  the roadside or haggling over prices. Get a transparent fare
                  estimate, track your ride in real-time, and arrive
                  comfortably.
                </p>
              </div>
              <div className={styles.card}>
                <h3>📦 Package Delivery</h3>
                <p>
                  Need to send something across town? Our delivery service picks
                  up your items and gets them to the destination safely. Perfect
                  for small businesses and personal errands.
                </p>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section className={styles.section}>
            <h2>Our Core Values</h2>
            <div className={styles.valuesGrid}>
              <div className={styles.valueItem}>
                <h4>Safety First</h4>
                <p>
                  Every trip is tracked, and every driver is vetted. Your peace
                  of mind is our priority.
                </p>
              </div>
              <div className={styles.valueItem}>
                <h4>Transparency</h4>
                <p>
                  What you see is what you pay. No hidden fees or surprise
                  surges after the trip starts.
                </p>
              </div>
              <div className={styles.valueItem}>
                <h4>Speed & Reliability</h4>
                <p>
                  We use smart technology to match you with the nearest driver
                  to reduce wait times.
                </p>
              </div>
              <div className={styles.valueItem}>
                <h4>Community</h4>
                <p>
                  We are building more than an app; we are building an economy
                  that supports local drivers.
                </p>
              </div>
            </div>
          </section>

          {/* NEW FAQ SECTION */}
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
          <footer className={styles.footer}>
            <p>&copy; {new Date().getFullYear()} Igle. All rights reserved.</p>
          </footer>
        </div>
      </main>
    </>
  );
};

export default About;
