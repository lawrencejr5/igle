import Image from "next/image";
import Link from "next/link";
import styles from "../styles/Terms.module.scss";
import Head from "next/head";

const TermsAndConditions = () => {
  return (
    <>
      <Head>
        <title>Terms &amp; Conditions | Igle</title>
        <meta
          name="description"
          content="Terms and Conditions for the Igle ride-hailing and delivery application by Omyann Technologies Ltd."
        />
      </Head>

      <main className={styles.container}>
        <div className={styles.wrapper}>
          <header className={styles.header}>
            {/* 1. Top Row: Back Button */}
            <div className={styles.topNav}>
              <Link href="/" className={styles.backButton}>
                ← Back to Home
              </Link>
            </div>

            {/* 2. Main Row: Logo Left, Title Right */}
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
                <h1>Terms &amp; Conditions</h1>
                <p className={styles.lastUpdated}>
                  Last updated: March 27, 2026
                </p>
              </div>
            </div>
          </header>

          <article className={styles.content}>
            <p>
              Please read these Terms and Conditions (&quot;Terms&quot;)
              carefully before using the Igle mobile application (the
              &quot;Service&quot;) operated by{" "}
              <strong>Omyann Technologies Ltd</strong> (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;).
            </p>
            <p>
              By downloading, registering for, or using the Igle app, you
              confirm that you have read, understood, and agree to be bound by
              these Terms and our{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>. If you do not
              agree, do not use the Service.
            </p>

            {/* 1. About Igle */}
            <section>
              <h2>1. About Igle</h2>
              <p>
                Igle is a technology platform that connects Riders seeking
                transportation with independent Drivers, and connects senders of
                packages with independent Courier Drivers. Omyann Technologies
                Ltd is a technology company — we do{" "}
                <strong>not</strong> provide transportation or delivery services
                directly, and we are not a transportation carrier or logistics
                company.
              </p>
              <p>
                The actual ride or delivery service is provided by independent
                third-party Drivers who are not employees or agents of Omyann
                Technologies Ltd. We facilitate the connection, payment, and
                coordination between the parties.
              </p>
            </section>

            {/* 2. Eligibility */}
            <section>
              <h2>2. Eligibility</h2>
              <p>To use the Igle Service, you must:</p>
              <ul>
                <li>Be at least <strong>18 years of age</strong>.</li>
                <li>
                  Have the legal capacity to enter into a binding contract under
                  the laws of Nigeria.
                </li>
                <li>
                  Possess a valid, verified phone number and email address.
                </li>
                <li>
                  Not have been previously suspended or removed from the Igle
                  platform for a violation of these Terms.
                </li>
              </ul>
              <p>
                For Drivers, additional eligibility requirements apply, including
                possession of a valid driver&apos;s licence, a roadworthy vehicle,
                and any regulatory permits required by applicable Nigerian law.
              </p>
            </section>

            {/* 3. Accounts */}
            <section>
              <h2>3. Accounts</h2>
              <p>
                When you create an account with us, you must provide accurate,
                complete, and current information. Providing false or misleading
                information is a breach of these Terms and may result in
                immediate termination of your account.
              </p>
              <p>
                You are responsible for:
              </p>
              <ul>
                <li>
                  Maintaining the confidentiality of your login credentials
                  (password, OTP codes).
                </li>
                <li>
                  All activity that occurs under your account, whether or not
                  authorised by you.
                </li>
                <li>
                  Notifying us immediately at{" "}
                  <a href="mailto:peter@omyanntechnologies.com">
                    peter@omyanntechnologies.com
                  </a>{" "}
                  if you suspect unauthorised access to your account.
                </li>
              </ul>
              <p>
                You may only hold one active Rider account and one active Driver
                account (if applicable) at any time. Creating duplicate or
                fraudulent accounts is prohibited.
              </p>
            </section>

            {/* 4. Ride-Hailing Services */}
            <section>
              <h2>4. Ride-Hailing Services</h2>
              <p>
                When you book a ride through Igle, you are requesting
                transportation from an independent Driver. By requesting a ride,
                you agree to the following:
              </p>

              <h3>4.1 Rider Responsibilities</h3>
              <ul>
                <li>
                  Be ready at the designated pickup location at the time of the
                  Driver&apos;s arrival.
                </li>
                <li>
                  Treat the Driver and their vehicle with respect. Any damage
                  caused to a Driver&apos;s vehicle by a Rider may result in a
                  damage fee being charged to the Rider&apos;s account.
                </li>
                <li>
                  Not request rides for the purpose of transporting prohibited
                  goods or engaging in any illegal activity.
                </li>
                <li>
                  Wear a seatbelt at all times during the ride, as required by
                  Nigerian traffic law.
                </li>
                <li>
                  Not exceed the stated passenger capacity of the vehicle.
                </li>
              </ul>

              <h3>4.2 Driver Responsibilities</h3>
              <ul>
                <li>
                  Maintain a roadworthy vehicle, a valid driver&apos;s licence, and
                  all applicable permits and insurance.
                </li>
                <li>Follow the agreed route to the destination.</li>
                <li>
                  Treat Riders with respect and provide a safe, professional
                  service.
                </li>
                <li>Not use mobile devices unsafely while driving.</li>
              </ul>

              <h3>4.3 Rider Conduct</h3>
              <p>
                You agree to comply with all applicable laws when using the
                Service. You will not cause nuisance, annoyance,
                inconvenience, or property damage to a Driver or any other
                party. Violations may result in account suspension.
              </p>
            </section>

            {/* 5. Delivery & Logistics Services */}
            <section>
              <h2>5. Delivery &amp; Logistics Services</h2>
              <p>
                Igle also facilitates package delivery through independent
                Courier Drivers. When using the delivery feature, you agree to
                the following:
              </p>

              <h3>5.1 Sender Responsibilities</h3>
              <ul>
                <li>
                  Accurately describe the contents, weight, and dimensions of
                  any package sent through the platform.
                </li>
                <li>
                  Ensure all packages are securely packed to prevent damage
                  during transit.
                </li>
                <li>
                  Ensure the recipient&apos;s contact details and address are
                  correct. Igle is not responsible for non-delivery due to
                  incorrect recipient information.
                </li>
              </ul>

              <h3>5.2 Prohibited Items</h3>
              <p>
                You must not send any items that are illegal, hazardous,
                dangerous, or prohibited by Nigerian law or our policies,
                including but not limited to:
              </p>
              <ul>
                <li>Illegal drugs or controlled substances</li>
                <li>Weapons, firearms, ammunition, or explosives</li>
                <li>Stolen or counterfeit goods</li>
                <li>Flammable or corrosive materials</li>
                <li>Human remains or body parts</li>
                <li>Live animals (unless explicitly approved in writing by Igle)</li>
                <li>
                  Cash or bearer instruments above amounts permitted by law
                </li>
              </ul>
              <p>
                Igle and its Courier Drivers reserve the right to refuse pickup
                or delivery of any package they reasonably suspect violates
                these Terms. Sending prohibited items may result in immediate
                account termination and referral to law enforcement.
              </p>

              <h3>5.3 Liability for Packages</h3>
              <p>
                Igle is a platform facilitating the connection between senders
                and Courier Drivers. We do not insure packages against loss,
                theft, or damage. Senders are encouraged to arrange their own
                insurance for high-value items. Claims for lost or damaged
                items must be raised within{" "}
                <strong>24 hours</strong> of the expected delivery time.
              </p>
            </section>

            {/* 6. Payments, Charges & Refunds */}
            <section>
              <h2>6. Payments, Charges &amp; Refunds</h2>

              <h3>6.1 Charges</h3>
              <p>
                Use of the Service results in charges for the rides or
                deliveries you request (&quot;Charges&quot;). Charges are
                calculated based on factors including distance, time, demand,
                and applicable surcharges. You will be shown a fare estimate
                before confirming a booking; final charges may vary due to
                actual route taken, waiting time, or tolls.
              </p>
              <p>
                Igle facilitates your payment of Charges on behalf of the
                Driver as the Driver&apos;s limited payment collection agent.
                Payment of Charges to Igle satisfies your payment obligation to
                the Driver for the service rendered.
              </p>

              <h3>6.2 Payment Methods</h3>
              <p>
                You may pay using in-app payment methods accepted on the
                platform (e.g., debit/credit card, bank transfer, or wallet
                balance). By providing a payment method, you authorise Igle to
                charge you for all Charges incurred under your account.
              </p>

              <h3>6.3 Cancellation Fees</h3>
              <p>
                You may cancel a ride or delivery request at any time before
                the Driver arrives. If you cancel after the Driver has already
                accepted and is en route, a <strong>cancellation fee</strong>{" "}
                may apply. The applicable fee will be displayed in the App at
                the time of cancellation.
              </p>
              <p>
                Drivers may also cancel a request. Repeated Driver cancellations
                without valid reason may result in penalties against the
                Driver&apos;s account.
              </p>

              <h3>6.4 Refunds</h3>
              <p>
                Refunds are issued at Igle&apos;s sole discretion and only where a
                clear error has occurred (e.g., an incorrect charge, a trip that
                did not take place). Refund requests must be submitted through
                the in-app support feature or by email within{" "}
                <strong>48 hours</strong> of the relevant transaction. Approved
                refunds will be credited to your original payment method
                within 5–10 business days.
              </p>

              <h3>6.5 Surge Pricing</h3>
              <p>
                During periods of high demand, dynamic pricing (&quot;surge
                pricing&quot;) may apply. You will be notified of any surge
                multiplier before confirming your booking, and your acceptance
                of the fare estimate constitutes agreement to the applicable
                pricing.
              </p>
            </section>

            {/* 7. Loyalty Rewards Programme */}
            <section>
              <h2>7. Loyalty Rewards Programme</h2>
              <p>
                Igle offers a loyalty rewards programme that allows Riders to
                earn points for completed trips and deliveries, which can be
                redeemed for fare discounts or other benefits.
              </p>
              <ul>
                <li>
                  Points are awarded only for completed, paid trips and
                  deliveries. Cancelled rides do not earn points.
                </li>
                <li>
                  Points have no cash value and cannot be transferred, sold, or
                  exchanged outside of the Igle platform.
                </li>
                <li>
                  Igle reserves the right to modify, suspend, or terminate the
                  loyalty programme at any time with reasonable notice.
                </li>
                <li>
                  Any attempt to fraudulently earn or redeem points (e.g.,
                  creating fake trips or referrals) will result in immediate
                  account termination and forfeiture of all accumulated points.
                </li>
                <li>
                  Points are forfeited immediately upon account deletion or
                  termination.
                </li>
              </ul>
            </section>

            {/* 8. Ratings & Reviews */}
            <section>
              <h2>8. Ratings &amp; Reviews</h2>
              <p>
                After each completed trip or delivery, both Riders and Drivers
                may rate each other. Ratings are used to maintain quality and
                safety on the platform.
              </p>
              <ul>
                <li>
                  Ratings must be honest and based on your genuine experience.
                </li>
                <li>
                  Submitting false, malicious, or retaliatory ratings is
                  prohibited.
                </li>
                <li>
                  Igle reserves the right to remove ratings that violate these
                  Terms.
                </li>
                <li>
                  Drivers who fall below the minimum platform rating threshold
                  may be suspended or removed from the platform.
                </li>
              </ul>
            </section>

            {/* 9. Safety */}
            <section>
              <h2>9. Safety</h2>
              <p>
                Your safety is a priority. Igle maintains safety features
                including real-time trip tracking, in-app emergency sharing, and
                a dedicated safety reporting channel.
              </p>
              <ul>
                <li>
                  If you feel unsafe during a trip, use the in-app emergency
                  feature or contact emergency services directly.
                </li>
                <li>
                  You must not engage in any threatening, abusive, discriminatory,
                  or violent behaviour towards any other user or Driver on the
                  platform.
                </li>
                <li>
                  Any reports of safety violations will be investigated. We
                  cooperate fully with Nigerian law enforcement authorities.
                </li>
                <li>
                  Igle may share relevant data (including location and contact
                  details) with emergency services or law enforcement in the
                  event of a confirmed safety emergency.
                </li>
              </ul>
            </section>

            {/* 10. Prohibited Conduct */}
            <section>
              <h2>10. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>
                  Use the Service for any unlawful purpose or in violation of
                  any local, state, national, or international law or regulation.
                </li>
                <li>
                  Impersonate any person or entity, or misrepresent your
                  affiliation with any person or entity.
                </li>
                <li>
                  Use the Service to solicit, collect, or store personal data
                  about other users.
                </li>
                <li>
                  Attempt to gain unauthorised access to the App, its servers,
                  or any connected systems.
                </li>
                <li>
                  Use automated bots, scrapers, or other tools to access or
                  interact with the Service without our prior written consent.
                </li>
                <li>
                  Engage in price manipulation, fraudulent bookings, or other
                  forms of platform abuse.
                </li>
                <li>
                  Use the Service in any manner that could damage, disable,
                  overburden, or impair the App or its infrastructure.
                </li>
              </ul>
            </section>

            {/* 11. Intellectual Property */}
            <section>
              <h2>11. Intellectual Property</h2>
              <p>
                The Igle name, logo, app interface, and all related content are
                the intellectual property of Omyann Technologies Ltd and are
                protected by Nigerian and international intellectual property
                laws. You are granted a limited, non-exclusive, non-transferable,
                revocable licence to use the App solely for your personal,
                non-commercial use.
              </p>
              <p>
                You may not copy, modify, distribute, sell, or lease any part of
                our Service or the software included in it, nor may you
                reverse-engineer or attempt to extract the source code of the
                App.
              </p>
            </section>

            {/* 12. Account Termination & Suspension */}
            <section>
              <h2>12. Account Termination &amp; Suspension</h2>
              <p>
                We reserve the right to suspend or terminate your account, at
                our sole discretion, immediately and without notice, for any of
                the following reasons:
              </p>
              <ul>
                <li>Breach of these Terms or our Privacy Policy</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Failure to pay outstanding Charges</li>
                <li>Providing false or misleading registration information</li>
                <li>Conduct that endangers the safety of other users or Drivers</li>
                <li>Sustained low ratings indicative of poor conduct (for Drivers)</li>
              </ul>
              <p>
                You may delete your account at any time from the App (Settings
                → Account → Delete Account). Upon account deletion, all your
                personal data will be permanently and immediately erased as
                described in our Privacy Policy.
              </p>
              <p>
                Upon termination, any outstanding Charges remain due and payable.
                Any accumulated loyalty points are forfeited.
              </p>
            </section>

            {/* 13. Disclaimers */}
            <section>
              <h2>13. Disclaimers</h2>
              <p>
                The Service is provided on an &quot;AS IS&quot; and &quot;AS
                AVAILABLE&quot; basis without warranties of any kind, whether
                express or implied. We do not warrant that:
              </p>
              <ul>
                <li>The Service will be uninterrupted, error-free, or secure.</li>
                <li>
                  Drivers meet any particular standard of quality beyond the
                  vetting we conduct at onboarding.
                </li>
                <li>
                  ETAs, fare estimates, or availability will always be accurate.
                </li>
              </ul>
              <p>
                Igle is not responsible for the actions, conduct, or
                performance of any Driver or Rider on the platform.
              </p>
            </section>

            {/* 14. Limitation of Liability */}
            <section>
              <h2>14. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Omyann
                Technologies Ltd and its directors, employees, partners, agents,
                and affiliates shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising from:
              </p>
              <ul>
                <li>
                  Your access to, use of, or inability to use the Service;
                </li>
                <li>
                  Any conduct or content of any Driver, Rider, or third party
                  using the Service;
                </li>
                <li>
                  Loss, theft, or damage to any package during delivery;
                </li>
                <li>
                  Unauthorised access to or alteration of your transmissions or
                  account data;
                </li>
                <li>
                  Any interruption or cessation of the Service.
                </li>
              </ul>
              <p>
                In any case, our total cumulative liability to you shall not
                exceed the total amount of Charges paid by you to Igle in the
                three (3) months immediately preceding the event giving rise to
                the claim.
              </p>
            </section>

            {/* 15. Indemnification */}
            <section>
              <h2>15. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Omyann
                Technologies Ltd and its officers, directors, employees, and
                agents from and against any claims, liabilities, damages, losses,
                and expenses (including reasonable legal fees) arising out of or
                in any way connected with:
              </p>
              <ul>
                <li>Your access to or use of the Service;</li>
                <li>Your violation of these Terms;</li>
                <li>Your violation of any applicable law or the rights of any third party.</li>
              </ul>
            </section>

            {/* 16. Third Party Services */}
            <section>
              <h2>16. Third-Party Services</h2>
              <p>
                The Service integrates third-party services including but not
                limited to Google Maps, Firebase, and payment processors. Your
                use of these third-party services within the App is subject to
                their respective terms and privacy policies. Omyann Technologies
                Ltd is not responsible for the availability, accuracy, or
                conduct of third-party services.
              </p>
            </section>

            {/* 17. Governing Law */}
            <section>
              <h2>17. Governing Law &amp; Dispute Resolution</h2>
              <p>
                These Terms shall be governed and construed in accordance with
                the laws of the <strong>Federal Republic of Nigeria</strong>,
                without regard to its conflict of law provisions.
              </p>
              <p>
                In the event of any dispute arising out of or in connection with
                these Terms or the Service, the parties agree to first attempt
                to resolve the dispute amicably through direct negotiation. If
                the dispute cannot be resolved within 30 days, it shall be
                referred to arbitration in Lagos, Nigeria, under the Arbitration
                and Conciliation Act.
              </p>
              <p>
                Nothing in this clause shall prevent either party from seeking
                urgent injunctive or equitable relief from a court of competent
                jurisdiction.
              </p>
            </section>

            {/* 18. Children */}
            <section>
              <h2>18. Minors</h2>
              <p>
                The Service is intended solely for users who are 18 years of age
                or older. By using the Service, you represent that you are at
                least 18 years old. If we discover that a user is under 18, we
                will immediately terminate their account and delete all associated
                data.
              </p>
            </section>

            {/* 19. Changes to Terms */}
            <section>
              <h2>19. Changes to These Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any
                time. For material changes, we will provide at least{" "}
                <strong>14 days&apos; notice</strong> via an in-app notification
                and/or email before the new terms take effect.
              </p>
              <p>
                By continuing to access or use the Service after revised Terms
                become effective, you agree to be bound by the updated Terms. If
                you do not agree to the new Terms, you must stop using the
                Service and may delete your account.
              </p>
            </section>

            {/* 20. Severability */}
            <section>
              <h2>20. Severability</h2>
              <p>
                If any provision of these Terms is found to be invalid or
                unenforceable by a court of competent jurisdiction, that
                provision shall be modified to the minimum extent necessary to
                make it enforceable, and the remaining provisions shall continue
                in full force and effect.
              </p>
            </section>

            {/* 21. Contact */}
            <section>
              <h2>21. Contact Us</h2>
              <p>
                If you have any questions or concerns about these Terms, please
                contact us:
              </p>
              <ul>
                <li>
                  <strong>Company:</strong> Omyann Technologies Ltd
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

export default TermsAndConditions;
