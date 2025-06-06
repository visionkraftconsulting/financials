import React from 'react';

const FaqPage = () => (
  <div className="container py-5">
    <h2>Frequently Asked Questions</h2>
    <h3>1. What is Smart Growth Assets?</h3>
    <p>
      Smart Growth Assets is a web application that helps you track, manage, and analyze your investment portfolio,
      including stocks, ETFs, cryptocurrencies, and more. It provides real-time pricing and performance metrics
      to help you make informed decisions.
    </p>

    <h3>2. How do I create an account?</h3>
    <p>
      Click on the “Register” link in the top navigation, provide your email and a password, and follow the email
      verification steps. Once verified, you can log in and start adding investments to your portfolio.
    </p>

    <h3>3. How do I add or remove an investment?</h3>
    <p>
      After logging in, navigate to the “Investments” page. Use the “Add Investment” button to enter details such
      as ticker symbol, quantity, and purchase price. To remove an investment, click the delete icon next to the
      holding in your portfolio list.
    </p>

    <h3>4. Where does the app get pricing data and how often is it updated?</h3>
    <p>
      Prices are fetched from reputable third-party market data providers (e.g., Alpha Vantage, CoinGecko). The data
      refreshes every 5 minutes while you have the dashboard open to give you up-to-date market information.
    </p>

    <h3>5. Is my personal and financial data secure?</h3>
    <p>
      Yes. We use industry-standard encryption (HTTPS/TLS) for data in transit and secure database storage for data
      at rest. Your credentials are hashed, and sensitive information is never exposed to third parties.
      We do not collect or store your secret keys, private keys, or seed phrases; these remain exclusively in your control.
    </p>

    <h3>6. Can I export or backup my data?</h3>
    <p>
      Yes. Visit the “Settings” page and click “Export Data” to download a CSV file of your portfolio holdings and
      transaction history.
    </p>

    <h3>7. How can I request a feature or report an issue?</h3>
    <p>
      Use the “Feature Request” button at the bottom right corner of the app or visit our <a href="/contact">Contact</a>
      page to send us feedback. Each submission creates a ticket so we can track and respond to your request.
    </p>

    <h3>8. What subscription plans are available?</h3>
    <p>
      We offer a free plan with basic portfolio tracking and a Pro plan that includes advanced analytics, alerts,
      and priority support. Visit the “Subscription” page to compare features and upgrade.
    </p>

    <h3>9. Does this app provide financial advice?</h3>
    <p>
      No. Smart Growth Assets provides educational and informational tools only and does not constitute financial,
      legal, or tax advice. Please consult a licensed professional before making any investment decisions.
    </p>

    <h3>10. Where can I find the full Terms, Privacy, and Disclosures?</h3>
    <p>
      You can review our <a href="/terms">Terms of Service</a>, <a href="/privacy">Privacy Policy</a>, and
      <a href="/disclosures">Disclosures</a> via the links in the footer or in the top navigation menu.
    </p>
  </div>
);

export default FaqPage;