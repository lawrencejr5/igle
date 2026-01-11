import Image from "next/image";
import styles from "../styles/PrivacyPolicy.module.scss"; // Adjust path as needed
import Head from "next/head";
import Link from "next/link";

const PrivacyPolicy = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | Igle</title>
        <meta
          name="description"
          content="Privacy Policy for the Igle application."
        />
      </Head>

      <main className={styles.container}>
        <div className={styles.wrapper}>
          {/* Header Section */}
          <header className={styles.header}>
            {/* 1. Top Row: Back Button (Left Aligned) */}
            <div className={styles.topNav}>
              <Link href="/" className={styles.backButton}>
                ← Back to Home
              </Link>
            </div>

            {/* 2. Main Row: Logo Left, Title Right */}
            <div className={styles.mainHeaderRow}>
              {/* Left: Logo */}
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
                    width={50}
                    height={50}
                    priority
                    style={{ objectFit: "contain", borderRadius: "10px" }}
                  />
                </div>
                <span className={styles.appName}>Igle</span>
              </div>

              {/* Right: Privacy Policy Title */}
              <div className={styles.titleSection}>
                <h1>Privacy Policy</h1>
                <p className={styles.lastUpdated}>
                  Last updated: October 05, 2025
                </p>
              </div>
            </div>
          </header>
          <article className={styles.content}>
            <p>
              This Privacy Policy describes Our policies and procedures on the
              collection, use and disclosure of Your information when You use
              the Service and tells You about Your privacy rights and how the
              law protects You.
            </p>
            <p>
              We use Your Personal data to provide and improve the Service. By
              using the Service, You agree to the collection and use of
              information in accordance with this Privacy Policy.
            </p>

            {/* Interpretation and Definitions */}
            <section>
              <h2>Interpretation and Definitions</h2>
              <h3>Interpretation</h3>
              <p>
                The words whose initial letters are capitalized have meanings
                defined under the following conditions. The following
                definitions shall have the same meaning regardless of whether
                they appear in singular or in plural.
              </p>

              <h3>Definitions</h3>
              <p>For the purposes of this Privacy Policy:</p>
              <ul>
                <li>
                  <strong>Account:</strong> A unique account created for You to
                  access our Service or parts of our Service.
                </li>
                <li>
                  <strong>Affiliate:</strong> An entity that controls, is
                  controlled by, or is under common control with a party, where
                  "control" means ownership of 50% or more of the shares, equity
                  interest or other securities entitled to vote for election of
                  directors or other managing authority.
                </li>
                <li>
                  <strong>Application:</strong> Refers to Igle, the software
                  program provided by the Company.
                </li>
                <li>
                  <strong>Company:</strong> (referred to as either "the
                  Company", "We", "Us" or "Our" in this Agreement) refers to
                  Igle.
                </li>
                <li>
                  <strong>Country:</strong> Nigeria.
                </li>
                <li>
                  <strong>Device:</strong> Any device that can access the
                  Service such as a computer, a cell phone or a digital tablet.
                </li>
                <li>
                  <strong>Personal Data:</strong> Any information that relates
                  to an identified or identifiable individual.
                </li>
                <li>
                  <strong>Service:</strong> Refers to the Application.
                </li>
                <li>
                  <strong>Service Provider:</strong> Any natural or legal person
                  who processes the data on behalf of the Company. It refers to
                  third-party companies or individuals employed by the Company
                  to facilitate the Service, to provide the Service on behalf of
                  the Company, to perform services related to the Service or to
                  assist the Company in analyzing how the Service is used.
                </li>
                <li>
                  <strong>Usage Data:</strong> Data collected automatically,
                  either generated by the use of the Service or from the Service
                  infrastructure itself (for example, the duration of a page
                  visit).
                </li>
                <li>
                  <strong>You:</strong> The individual accessing or using the
                  Service, or the company, or other legal entity on behalf of
                  which such individual is accessing or using the Service, as
                  applicable.
                </li>
              </ul>
            </section>

            {/* Collecting Data */}
            <section>
              <h2>Collecting and Using Your Personal Data</h2>
              <h3>Types of Data Collected</h3>

              <h4>Personal Data</h4>
              <p>
                While using Our Service, We may ask You to provide Us with
                certain personally identifiable information that can be used to
                contact or identify You. Personally identifiable information may
                include, but is not limited to:
              </p>
              <ul>
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
              </ul>

              <h4>Usage Data</h4>
              <p>
                Usage Data is collected automatically when using the Service.
                Usage Data may include information such as Your Device's
                Internet Protocol address (e.g. IP address), browser type,
                browser version, the pages of our Service that You visit, the
                time and date of Your visit, the time spent on those pages,
                unique device identifiers and other diagnostic data.
              </p>
              <p>
                When You access the Service by or through a mobile device, We
                may collect certain information automatically, including, but
                not limited to, the type of mobile device You use, Your mobile
                device's unique ID, the IP address of Your mobile device, Your
                mobile operating system, the type of mobile Internet browser You
                use, unique device identifiers and other diagnostic data.
              </p>

              <h4>Information Collected while Using the Application</h4>
              <p>
                While using Our Application, in order to provide features of Our
                Application, We may collect, with Your prior permission:
              </p>
              <ul>
                <li>
                  <strong>Information regarding your location:</strong> We use
                  this to enable ride matching, navigation for drivers, tracking
                  of deliveries, and to provide accurate estimated arrival times
                  (ETAs).
                </li>
                <li>
                  <strong>
                    Pictures and other information from your Device's camera and
                    photo library:
                  </strong>{" "}
                  We use this to allow users to set profile pictures and for
                  delivery verification (e.g., taking a photo of a delivered
                  package at the recipient's door).
                </li>
              </ul>
              <p>
                We use this information to provide features of Our Service, to
                improve and customize Our Service. The information may be
                uploaded to the Company's servers and/or a Service Provider's
                server or it may be simply stored on Your device. You can enable
                or disable access to this information at any time, through Your
                Device settings.
              </p>
            </section>

            {/* Use of Data */}
            <section>
              <h2>Use of Your Personal Data</h2>
              <p>
                The Company may use Personal Data for the following purposes:
              </p>
              <ul>
                <li>
                  <strong>To provide and maintain our Service:</strong>{" "}
                  Including to monitor the usage of our Service.
                </li>
                <li>
                  <strong>To manage Your Account:</strong> To manage Your
                  registration as a user of the Service.
                </li>
                <li>
                  <strong>For the performance of a contract:</strong> The
                  development, compliance and undertaking of the purchase
                  contract for the services You have purchased.
                </li>
                <li>
                  <strong>To contact You:</strong> To contact You by email,
                  telephone calls, SMS, or other equivalent forms of electronic
                  communication, such as a mobile application's push
                  notifications regarding updates or informative communications.
                </li>
                <li>
                  <strong>To provide You with news:</strong> Special offers and
                  general information about other goods, services and events
                  which We offer.
                </li>
                <li>
                  <strong>To manage Your requests:</strong> To attend and manage
                  Your requests to Us.
                </li>
                <li>
                  <strong>For business transfers:</strong> We may use Your
                  information to evaluate or conduct a merger, divestiture,
                  restructuring, reorganization, dissolution, or other sale or
                  transfer of some or all of Our assets.
                </li>
              </ul>
            </section>

            {/* Disclosure */}
            <section>
              <h2>Disclosure of Your Personal Data</h2>
              <h3>Business Transactions</h3>
              <p>
                If the Company is involved in a merger, acquisition or asset
                sale, Your Personal Data may be transferred. We will provide
                notice before Your Personal Data is transferred and becomes
                subject to a different Privacy Policy.
              </p>

              <h3>Law enforcement</h3>
              <p>
                Under certain circumstances, the Company may be required to
                disclose Your Personal Data if required to do so by law or in
                response to valid requests by public authorities (e.g. a court
                or a government agency).
              </p>
            </section>

            {/* Security */}
            <section>
              <h2>Security of Your Personal Data</h2>
              <p>
                The security of Your Personal Data is important to Us, but
                remember that no method of transmission over the Internet, or
                method of electronic storage is 100% secure. While We strive to
                use commercially reasonable means to protect Your Personal Data,
                We cannot guarantee its absolute security.
              </p>
            </section>

            {/* Third Party Services */}
            <section>
              <h2>Service Providers</h2>
              <p>
                We may use third-party Service Providers to maintain and improve
                our Service.
              </p>
              <h3>Google Places</h3>
              <p>
                Google Places is a service that returns information about places
                using HTTP requests. It is operated by Google. Google Places
                service may collect information from You and from Your Device
                for security purposes.
              </p>
              <p>
                The information gathered by Google Places is held in accordance
                with the Privacy Policy of Google:{" "}
                <a
                  href="https://www.google.com/intl/en/policies/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.google.com/intl/en/policies/privacy/
                </a>
              </p>
            </section>

            {/* Links */}
            <section>
              <h2>Links to Other Websites</h2>
              <p>
                Our Service may contain links to other websites that are not
                operated by Us. If You click on a third party link, You will be
                directed to that third party's site. We strongly advise You to
                review the Privacy Policy of every site You visit.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2>Changes to this Privacy Policy</h2>
              <p>
                We may update Our Privacy Policy from time to time. We will
                notify You of any changes by posting the new Privacy Policy on
                this page. We will let You know via email and/or a prominent
                notice on Our Service, prior to the change becoming effective
                and update the "Last updated" date at the top of this Privacy
                Policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2>Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, You can
                contact us:
              </p>
              <ul>
                <li>
                  By email:{" "}
                  <a href="mailto:peter@omyanntechnologies.com">
                    peter@omyanntechnologies.com
                  </a>
                </li>
              </ul>
            </section>
          </article>

          <footer className={styles.footer}>
            <p>&copy; {new Date().getFullYear()} Igle. All rights reserved.</p>
          </footer>
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;
