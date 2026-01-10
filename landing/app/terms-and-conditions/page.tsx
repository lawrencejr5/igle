import Image from "next/image";
import Link from "next/link";
import styles from "../styles/Terms.module.scss";
import Head from "next/head";

const TermsAndConditions = () => {
  return (
    <>
      <Head>
        <title>Terms & Conditions | Igle</title>
        <meta
          name="description"
          content="Terms and Conditions for the Igle application."
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
                <h1>Terms & Conditions</h1>
                <p className={styles.lastUpdated}>
                  Last updated: October 05, 2025
                </p>
              </div>
            </div>
          </header>

          <article className={styles.content}>
            <p>
              Please read these Terms and Conditions ("Terms", "Terms and
              Conditions") carefully before using the Igle mobile application
              (the "Service") operated by Igle ("us", "we", or "our").
            </p>
            <p>
              Your access to and use of the Service is conditioned on your
              acceptance of and compliance with these Terms. These Terms apply
              to all visitors, users, and others who access or use the Service.
            </p>
            <p>
              By accessing or using the Service you agree to be bound by these
              Terms. If you disagree with any part of the terms then you may not
              access the Service.
            </p>

            <section>
              <h2>1. Accounts</h2>
              <p>
                When you create an account with us, you must provide us
                information that is accurate, complete, and current at all
                times. Failure to do so constitutes a breach of the Terms, which
                may result in immediate termination of your account on our
                Service.
              </p>
              <p>
                You are responsible for safeguarding the password that you use
                to access the Service and for any activities or actions under
                your password, whether your password is with our Service or a
                third-party service.
              </p>
            </section>

            <section>
              <h2>2. Ride-Hailing Services</h2>
              <p>
                Igle provides a platform that connects users with independent
                third-party drivers. We do not provide transportation services,
                and we are not a transportation carrier. It is up to the
                third-party driver to offer transportation services to you and
                it is up to you to accept such transportation services.
              </p>
              <h3>User Conduct</h3>
              <p>
                You agree to comply with all applicable laws when using the
                Services, and you may only use the Services for lawful purposes.
                You will not, in your use of the Services, cause nuisance,
                annoyance, inconvenience, or property damage, whether to the
                Third Party Provider or any other party.
              </p>
            </section>

            <section>
              <h2>3. Delivery & Logistics Services</h2>
              <h3>Prohibited Items</h3>
              <p>
                When using Igle for package delivery, you agree not to send
                items that are illegal, hazardous, dangerous, or otherwise
                prohibited by local laws or our policies. This includes, but is
                not limited to:
              </p>
              <ul>
                <li>
                  <strong>Illegal drugs or substances.</strong>
                </li>
                <li>
                  <strong>Weapons, firearms, or explosives.</strong>
                </li>
                <li>
                  <strong>Stolen goods.</strong>
                </li>
                <li>
                  <strong>Live animals (unless explicitly approved).</strong>
                </li>
              </ul>
              <p>
                Igle and its drivers reserve the right to refuse delivery of any
                item that they suspect violates these terms.
              </p>
            </section>

            <section>
              <h2>4. Payments and Cancellations</h2>
              <p>
                You understand that use of the Services may result in charges to
                you for the services or goods you receive ("Charges"). Igle will
                facilitate your payment of the applicable Charges on behalf of
                the Third Party Provider as such Third Party Provider’s limited
                payment collection agent.
              </p>
              <h3>Cancellation Policy</h3>
              <p>
                You may elect to cancel your request for services from a Third
                Party Provider at any time prior to such Third Party Provider’s
                arrival, in which case you may be charged a cancellation fee.
              </p>
            </section>

            <section>
              <h2>5. Limitation of Liability</h2>
              <p>
                In no event shall Igle, nor its directors, employees, partners,
                agents, suppliers, or affiliates, be liable for any indirect,
                incidental, special, consequential or punitive damages,
                including without limitation, loss of profits, data, use,
                goodwill, or other intangible losses, resulting from:
              </p>
              <ul>
                <li>
                  Your access to or use of or inability to access or use the
                  Service;
                </li>
                <li>
                  Any conduct or content of any third party on the Service;
                </li>
                <li>Any content obtained from the Service; and</li>
                <li>
                  Unauthorized access, use or alteration of your transmissions
                  or content.
                </li>
              </ul>
            </section>

            <section>
              <h2>6. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with
                the laws of <strong>Nigeria</strong>, without regard to its
                conflict of law provisions.
              </p>
              <p>
                Our failure to enforce any right or provision of these Terms
                will not be considered a waiver of those rights. If any
                provision of these Terms is held to be invalid or unenforceable
                by a court, the remaining provisions of these Terms will remain
                in effect.
              </p>
            </section>

            <section>
              <h2>7. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or
                replace these Terms at any time. If a revision is material we
                will try to provide at least 30 days notice prior to any new
                terms taking effect. What constitutes a material change will be
                determined at our sole discretion.
              </p>
              <p>
                By continuing to access or use our Service after those revisions
                become effective, you agree to be bound by the revised terms. If
                you do not agree to the new terms, please stop using the
                Service.
              </p>
            </section>

            <section>
              <h2>Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us:
              </p>
              <ul>
                <li>
                  By email:{" "}
                  <a href="mailto:oputalawrence@gmail.com">
                    oputalawrence@gmail.com
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

export default TermsAndConditions;
