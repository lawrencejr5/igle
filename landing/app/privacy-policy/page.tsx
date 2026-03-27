import Image from "next/image";
import styles from "../styles/PrivacyPolicy.module.scss";
import Head from "next/head";
import Link from "next/link";

const PrivacyPolicy = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | Igle</title>
        <meta
          name="description"
          content="Privacy Policy for the Igle ride-hailing and delivery application by Omyann Technologies Ltd."
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
                  Last updated: March 27, 2026
                </p>
              </div>
            </div>
          </header>
          <article className={styles.content}>
            <p>
              Igle (&quot;the App&quot;) is a ride-hailing and delivery platform
              operated by <strong>Omyann Technologies Ltd</strong>. This Privacy
              Policy describes how we collect, use, store, share, and protect
              your personal information when you use the Igle mobile application
              and related services.
            </p>
            <p>
              By downloading, registering for, or using Igle, you agree to the
              practices described in this Privacy Policy. If you do not agree,
              please do not use the App.
            </p>

            {/* Interpretation and Definitions */}
            <section>
              <h2>1. Interpretation and Definitions</h2>
              <h3>Interpretation</h3>
              <p>
                Words with capitalised initial letters have meanings defined
                below. These definitions apply equally in singular and plural
                forms.
              </p>

              <h3>Definitions</h3>
              <ul>
                <li>
                  <strong>Account:</strong> A unique account created for you to
                  access the Service or parts of the Service.
                </li>
                <li>
                  <strong>Application / App:</strong> Igle, the mobile software
                  provided by Omyann Technologies Ltd.
                </li>
                <li>
                  <strong>Company / We / Us / Our:</strong> Omyann Technologies
                  Ltd, the operator of the Igle platform.
                </li>
                <li>
                  <strong>Country:</strong> Nigeria.
                </li>
                <li>
                  <strong>Device:</strong> Any device capable of accessing the
                  Service, such as a smartphone or tablet.
                </li>
                <li>
                  <strong>Driver:</strong> A registered service provider on the
                  Igle platform who delivers rides or packages.
                </li>
                <li>
                  <strong>Rider / User:</strong> An individual who books a ride
                  or delivery through Igle.
                </li>
                <li>
                  <strong>Personal Data:</strong> Any information that relates
                  to an identified or identifiable individual.
                </li>
                <li>
                  <strong>Precise Location Data:</strong> GPS-level coordinates
                  identifying your real-time or trip-level geographical
                  location.
                </li>
                <li>
                  <strong>Service:</strong> The Igle mobile application and all
                  associated features, including ride-hailing, delivery, and
                  loyalty rewards.
                </li>
                <li>
                  <strong>Service Provider:</strong> Third-party companies or
                  individuals that process data on our behalf to help provide
                  the Service.
                </li>
                <li>
                  <strong>Usage Data:</strong> Data collected automatically from
                  your use of the Service, such as device identifiers, IP
                  addresses, and in-app behaviour.
                </li>
              </ul>
            </section>

            {/* Data We Collect */}
            <section>
              <h2>2. Data We Collect</h2>

              <h3>2.1 Account &amp; Identity Information</h3>
              <p>When you register or update your profile, we collect:</p>
              <ul>
                <li>Full name</li>
                <li>Email address</li>
                <li>
                  <strong>Phone number</strong> — used to create your account,
                  verify your identity via OTP, and facilitate direct
                  communication between Riders and Drivers (masked or proxied
                  where technically possible)
                </li>
                <li>Profile photograph</li>
                <li>
                  For Drivers: government-issued ID, driver&apos;s licence,
                  vehicle registration details, and bank/payment account
                  information
                </li>
              </ul>

              <h3>2.2 Precise Location Data</h3>
              <p>
                Igle requires access to your device&apos;s{" "}
                <strong>precise GPS location</strong> to function. Location data
                is used for:
              </p>
              <ul>
                <li>Matching Riders with nearby Drivers in real time</li>
                <li>Calculating routes, distances, and fare estimates</li>
                <li>
                  Providing turn-by-turn navigation for Drivers via Google Maps
                </li>
                <li>Tracking ongoing ride and delivery progress</li>
                <li>Generating Estimated Times of Arrival (ETAs)</li>
                <li>Preventing fraud and ensuring trip accuracy</li>
                <li>
                  Resolving disputes about trip start/end points or delivery
                  completion
                </li>
              </ul>
              <p>
                <strong>Foreground location</strong> is collected while you
                actively use the App. <strong>Background location</strong> may
                be collected during an active trip or delivery so the App can
                continuously track progress even if you switch to another app.
                Drivers may have background location collected while they are
                online and available for requests, to enable accurate dispatch.
                You will be explicitly prompted to grant these permissions, and
                you may revoke them at any time in your device&apos;s Settings
                app; however, doing so may prevent core features from
                functioning.
              </p>
              <p>
                We do <strong>not</strong> sell your location data to
                advertisers or data brokers.
              </p>

              <h3>2.3 Phone Number &amp; Communications</h3>
              <p>Your phone number is used to:</p>
              <ul>
                <li>Verify your identity during sign-up and login</li>
                <li>
                  Facilitate in-app calling and messaging between Riders and
                  Drivers (calls may be routed through a masked/proxy number to
                  protect both parties&apos; actual numbers)
                </li>
                <li>
                  Send transactional SMS messages (e.g., OTP codes, trip
                  receipts)
                </li>
                <li>
                  Send safety-related alerts (e.g., trip-started notifications)
                </li>
              </ul>
              <p>
                We do <strong>not</strong> share your actual phone number with
                other users beyond what is technically necessary for the
                communication to occur.
              </p>

              <h3>2.4 Push Notifications</h3>
              <p>We send push notifications to your device for:</p>
              <ul>
                <li>
                  Trip status updates (driver arriving, trip started, trip
                  completed)
                </li>
                <li>
                  Delivery status updates (picked up, en route, delivered)
                </li>
                <li>Driver-side ride and delivery requests</li>
                <li>Loyalty rewards earned or redeemed</li>
                <li>
                  Promotional offers and app announcements (only with your
                  consent)
                </li>
                <li>Account and payment-related alerts</li>
              </ul>
              <p>
                You can manage notification preferences in the App Settings or
                in your device&apos;s system Settings. Disabling notifications
                may prevent you from receiving critical trip updates.
              </p>

              <h3>2.5 Camera &amp; Photo Library</h3>
              <p>
                We request access to your device&apos;s camera and photo library
                to:
              </p>
              <ul>
                <li>Allow you to upload a profile photograph</li>
                <li>
                  Allow Drivers to photograph a delivered package at the
                  recipient&apos;s location as proof of delivery
                </li>
                <li>
                  Allow Drivers to upload required verification documents during
                  onboarding
                </li>
              </ul>
              <p>
                Images are uploaded to our secure servers and/or our cloud
                storage provider only when explicitly triggered by the user.
                Photos taken for delivery verification may be shared with the
                relevant Rider.
              </p>

              <h3>2.6 Usage &amp; Diagnostic Data</h3>
              <p>We automatically collect usage and device data, including:</p>
              <ul>
                <li>Device model, operating system, and version</li>
                <li>App version and session information</li>
                <li>IP address</li>
                <li>Crash logs and performance diagnostics</li>
                <li>Feature usage patterns (to improve the App)</li>
              </ul>

              <h3>2.7 Payment &amp; Transaction Data</h3>
              <p>For processing payments, we may collect:</p>
              <ul>
                <li>
                  Payment method details (card or bank information, handled by
                  our payment processor — we do not store raw card numbers)
                </li>
                <li>Transaction history (trip fare, delivery fees, tips)</li>
                <li>Loyalty points balance and redemption history</li>
              </ul>

              <h3>2.8 Loyalty Rewards Data</h3>
              <p>
                Igle operates a loyalty rewards programme. To administer this,
                we track:
              </p>
              <ul>
                <li>Number of completed trips and deliveries</li>
                <li>Points earned per activity</li>
                <li>Points redeemed for discounts or rewards</li>
                <li>Referral activity (if applicable)</li>
              </ul>
              <p>
                This data is used solely to calculate your rewards balance and
                personalise relevant offers. It is not sold to third parties.
              </p>
            </section>

            {/* How We Use Data */}
            <section>
              <h2>3. How We Use Your Data</h2>
              <p>We use your personal data for the following purposes:</p>
              <ul>
                <li>
                  <strong>Service Delivery:</strong> To provide ride-hailing and
                  delivery services, including matching, dispatch, navigation,
                  and real-time tracking.
                </li>
                <li>
                  <strong>Account Management:</strong> To create and manage your
                  Rider or Driver account.
                </li>
                <li>
                  <strong>Communication:</strong> To contact you by push
                  notification, in-app message, email, or SMS regarding your
                  trips, deliveries, and account.
                </li>
                <li>
                  <strong>Safety &amp; Security:</strong> To verify identities,
                  investigate fraud, resolve disputes, and protect all parties
                  involved in a trip.
                </li>
                <li>
                  <strong>Payments:</strong> To process fares, delivery fees,
                  refunds, and Driver payouts.
                </li>
                <li>
                  <strong>Loyalty Rewards:</strong> To calculate, award, and
                  redeem loyalty points based on your activity on the platform.
                </li>
                <li>
                  <strong>Product Improvement:</strong> To analyse usage
                  patterns, debug issues, and improve the App&apos;s features
                  and performance.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> To comply with applicable
                  Nigerian laws and regulations, and to respond to lawful
                  requests from government authorities.
                </li>
                <li>
                  <strong>Promotional Communications:</strong> To send you
                  offers, news, and updates about Igle, where you have not opted
                  out of such communications.
                </li>
              </ul>
            </section>

            {/* Third-Party SDKs */}
            <section>
              <h2>4. Third-Party SDKs and Service Providers</h2>
              <p>
                Igle integrates third-party software development kits (SDKs) and
                services that may independently collect data from your device.
                These include:
              </p>

              <h3>4.1 Google Maps SDK / Google Places API</h3>
              <p>
                We use Google Maps and Google Places to provide mapping,
                location search, route calculation, and navigation within the
                App. Google may collect your device&apos;s location, IP address,
                and usage data in accordance with Google&apos;s Privacy Policy:{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://policies.google.com/privacy
                </a>
              </p>

              <h3>4.2 Firebase (Google)</h3>
              <p>
                We use Firebase for authentication, real-time database
                synchronisation, cloud storage, crash reporting (Crashlytics),
                and push notifications (Firebase Cloud Messaging). Firebase is
                subject to Google&apos;s Privacy Policy listed above.
              </p>

              <h3>4.3 Payment Processor</h3>
              <p>
                Payment transactions are processed by a third-party payment
                provider. Your payment details are transmitted directly to and
                handled by this provider in accordance with PCI-DSS standards.
                We do not store raw card or bank account numbers on our servers.
              </p>

              <h3>4.4 Analytics</h3>
              <p>
                We may use analytics tools to understand how users interact with
                the App, improve features, and resolve technical issues. These
                tools may collect anonymised or pseudonymised usage data.
              </p>

              <h3>4.5 Social Sign-In (Apple &amp; Google)</h3>
              <p>
                You may sign in to Igle using your Apple ID (on iOS) or your
                Google Account (on Android). When you do:
              </p>
              <ul>
                <li>
                  <strong>Sign in with Apple:</strong> Apple may share a
                  masked or real email address and your name with us,
                  depending on your privacy settings. This is governed by
                  Apple&apos;s Privacy Policy:{" "}
                  <a
                    href="https://www.apple.com/legal/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.apple.com/legal/privacy/
                  </a>
                </li>
                <li>
                  <strong>Sign in with Google:</strong> Google may share
                  your name, email address, and profile photo with us. This
                  is governed by Google&apos;s Privacy Policy:{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://policies.google.com/privacy
                  </a>
                </li>
              </ul>
              <p>
                We only request the minimum information necessary to create
                and manage your Igle account. We do not post to your social
                accounts on your behalf.
              </p>

              <p>
                We require all Service Providers to maintain data
                confidentiality and to use your information only to perform
                services on our behalf.
              </p>
            </section>

            {/* Sharing Data */}
            <section>
              <h2>5. Sharing Your Personal Data</h2>
              <p>
                We may share your information in the following circumstances:
              </p>
              <ul>
                <li>
                  <strong>Between Riders and Drivers:</strong> When a trip or
                  delivery is matched, limited profile information (first name,
                  profile photo, vehicle details for Drivers, and trip
                  destination) is shared between the relevant parties to
                  facilitate the service.
                </li>
                <li>
                  <strong>Service Providers:</strong> With companies that
                  process data on our behalf (e.g., payment processors, cloud
                  hosting, analytics providers, SMS/notification providers)
                  under strict data-processing agreements.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law,
                  court order, or any governmental or regulatory authority, or
                  to protect the rights, property, or safety of Omyann
                  Technologies Ltd, its users, or the public.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger,
                  acquisition, or sale of all or part of our assets, your data
                  may be transferred. We will notify you before your data
                  becomes subject to a different privacy policy.
                </li>
                <li>
                  <strong>Safety Emergencies:</strong> We may share location or
                  contact data with emergency services or law enforcement if we
                  believe there is a genuine risk to the life or safety of any
                  person.
                </li>
              </ul>
              <p>
                We <strong>do not</strong> sell, rent, or trade your personal
                data to advertisers or any third party for their independent
                marketing purposes.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2>6. Data Retention &amp; Account Deletion</h2>

              <h3>6.1 Account Activity Logs</h3>
              <p>
                We maintain a log of account activity to ensure the security
                and integrity of the platform. This includes records of:
              </p>
              <ul>
                <li>Ride bookings and delivery requests (placed, accepted, completed)</li>
                <li>Trip or delivery cancellations and the reason provided</li>
                <li>Changes to account information (e.g., phone number, password, profile photo updates)</li>
                <li>Login events and device sessions</li>
                <li>Loyalty points earned, spent, or adjusted</li>
                <li>Payment transactions and receipts</li>
              </ul>
              <p>
                These logs are retained for the duration of your account and
                are used for dispute resolution, fraud prevention, and platform
                safety.
              </p>

              <h3>6.2 Active Account Data</h3>
              <ul>
                <li>
                  <strong>Live location data</strong> outside of an active trip
                  is not retained beyond the session in which it was collected.
                </li>
                <li>
                  <strong>Trip and delivery location history</strong> for a
                  specific completed journey is retained for up to 3 years for
                  safety, dispute resolution, and regulatory compliance.
                </li>
              </ul>

              <h3>6.3 Account Deletion — Full Data Wipe</h3>
              <p>
                When you delete your Igle account, <strong>we immediately and
                permanently delete all of your personal data</strong> from our
                active systems, including:
              </p>
              <ul>
                <li>Profile information (name, email, phone number, profile photo)</li>
                <li>All ride and delivery history</li>
                <li>Account activity logs</li>
                <li>Transaction and payment records</li>
                <li>Loyalty rewards balance and history</li>
                <li>Saved addresses and preferences</li>
                <li>Any uploaded documents or images</li>
              </ul>
              <p>
                There is <strong>no grace period</strong> — deletion is
                immediate and irreversible. Once your account is deleted,
                your data cannot be recovered. If you later wish to use Igle
                again, you will need to create a new account.
              </p>
              <p>
                You may request account deletion at any time from within the
                Igle App (Settings → Account → Delete Account) or by
                contacting us at{" "}
                <a href="mailto:peter@omyanntechnologies.com">
                  peter@omyanntechnologies.com
                </a>
                .
              </p>
            </section>

            {/* Location Use Details */}
            <section>
              <h2>7. Location Data — Detailed Disclosure</h2>
              <p>
                Because Igle is a location-dependent service, we provide the
                following additional disclosures in compliance with Apple App
                Store guidelines:
              </p>
              <ul>
                <li>
                  <strong>Type of location data:</strong> Precise GPS
                  coordinates (latitude and longitude).
                </li>
                <li>
                  <strong>When collected — Riders:</strong> When you open the
                  App to book a trip (foreground), and continuously during an
                  active trip (foreground and potentially background, to display
                  your position to the Driver and track trip progress).
                </li>
                <li>
                  <strong>When collected — Drivers:</strong> When you are online
                  and available for requests (background location to enable
                  dispatch), and continuously throughout an active trip or
                  delivery.
                </li>
                <li>
                  <strong>Purpose:</strong> Matching, routing, navigation, ETA
                  calculation, fraud prevention, and trip dispute resolution.
                </li>
                <li>
                  <strong>Sharing:</strong> Your real-time location during a
                  trip is visible to the other party (Rider sees Driver&apos;s
                  location; Driver sees Rider&apos;s pickup location). It is not
                  shared with advertisers.
                </li>
                <li>
                  <strong>Opt-out:</strong> You can revoke location permissions
                  via your device&apos;s Settings app at any time, but the App
                  will not function without location access.
                </li>
              </ul>
            </section>

            {/* Security */}
            <section>
              <h2>8. Security of Your Personal Data</h2>
              <p>
                We implement industry-standard security measures to protect your
                data, including:
              </p>
              <ul>
                <li>Encrypted data transmission (TLS/HTTPS)</li>
                <li>Secure cloud infrastructure with access controls</li>
                <li>Regular security assessments and monitoring</li>
                <li>
                  Restricted employee access to personal data on a need-to-know
                  basis
                </li>
              </ul>
              <p>
                No method of transmission over the Internet or electronic
                storage is 100% secure. While we strive to use commercially
                reasonable means to protect your data, we cannot guarantee
                absolute security. In the event of a data breach that affects
                your rights or freedoms, we will notify you as required by
                applicable law.
              </p>
            </section>

            {/* Children */}
            <section>
              <h2>9. Children&apos;s Privacy</h2>
              <p>
                Igle is not directed at or intended for use by individuals under
                the age of 18. We do not knowingly collect personal data from
                anyone under 18. If you believe a minor has provided us with
                personal data, please contact us immediately at{" "}
                <a href="mailto:peter@omyanntechnologies.com">
                  peter@omyanntechnologies.com
                </a>{" "}
                and we will delete such data promptly.
              </p>
            </section>

            {/* User Rights */}
            <section>
              <h2>10. Your Rights and Choices</h2>
              <p>
                Depending on your location and applicable law, you may have the
                following rights with respect to your personal data:
              </p>
              <ul>
                <li>
                  <strong>Access:</strong> Request a copy of the personal data
                  we hold about you.
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  or incomplete data. You can update most information directly
                  within the App.
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account
                  and associated personal data, subject to our legal retention
                  obligations. You may submit a deletion request from within the
                  App or by contacting us at the email below.
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Where we process your data
                  based on consent (e.g., marketing communications, background
                  location), you may withdraw consent at any time without
                  affecting the lawfulness of prior processing.
                </li>
                <li>
                  <strong>Push Notifications:</strong> You may disable push
                  notifications at any time through your device&apos;s Settings
                  app or through the Igle App Settings.
                </li>
                <li>
                  <strong>Location Permissions:</strong> You may change location
                  access settings (foreground only, or deny entirely) through
                  your device&apos;s Settings app at any time.
                </li>
              </ul>
              <p>
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:peter@omyanntechnologies.com">
                  peter@omyanntechnologies.com
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            {/* International */}
            <section>
              <h2>11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed on servers
                located outside Nigeria (for example, through cloud providers
                such as Google Firebase). Where data is transferred
                internationally, we ensure adequate protections are in place
                consistent with applicable data protection laws.
              </p>
            </section>

            {/* Links */}
            <section>
              <h2>12. Links to Other Websites</h2>
              <p>
                Our Service may contain links to third-party websites or
                services. We are not responsible for the privacy practices of
                those third parties. We encourage you to review the Privacy
                Policy of every site you visit.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2>13. Changes to this Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices, technology, legal requirements, or
                other factors. When we make material changes, we will:
              </p>
              <ul>
                <li>
                  Post the updated Policy on this page with a revised &quot;Last
                  updated&quot; date
                </li>
                <li>
                  Send you an in-app notification and/or email, where the
                  changes are significant
                </li>
              </ul>
              <p>
                Your continued use of the App after changes become effective
                constitutes your acceptance of the revised Policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2>14. Contact Us</h2>
              <p>
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or our data practices, please contact us:
              </p>
              <ul>
                <li>
                  <strong>Company:</strong> Omyann Technologies Ltd
                </li>
                <li>
                  <strong>App:</strong> Igle
                </li>
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
            <p>
              &copy; {new Date().getFullYear()} Omyann Technologies Ltd. All
              rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;
