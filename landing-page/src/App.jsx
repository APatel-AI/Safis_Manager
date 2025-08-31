import React from "react";
import glassesLogo from "./assets/glasses_emoji.png";

function App() {
  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <a href="#" className="logo">
              Safis
            </a>
            <nav className="nav">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it Works</a>
              <a href="#install">Install</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-icon">
              <img src={glassesLogo} alt="Safis Icon" />
            </div>
            <h1>Bookmark manager for busy professionals</h1>
            <p className="hero-subtitle">
              As a Developer in the early career stage managing multiple
              projects and deadlines can make tracking your bookmarks
              feel like a job in itself. That's exactly why I built Safis, a
              smart bookmark manager designed to stay out of your way and just
              work.
            </p>
            <div className="cta-buttons">
              <a href="#install" className="btn-primary">
                Download for Chrome
              </a>
            </div>
          </div>
        </section>

        <section className="demo-section">
          <div className="container">
            <div className="demo-image">
              <div className="demo-placeholder">
                <h3>Interactive Demo</h3>
                <p>Floating bookmark modal overlay in action</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features-section">
          <div className="container">
            <h2 className="features-title">Less features, more focus.</h2>
            <p className="features-subtitle">
              There are plenty of tools for bookmark management, but most are
              bloated with features you'll never use. Safis is different — a
              lightweight floating modal that gives you exactly what you need.
            </p>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon"></div>
                <h3 className="feature-title">Quick Access</h3>
                <p className="feature-description">
                  Access your bookmarks instantly with a floating modal that
                  appears on any webpage
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"></div>
                <h3 className="feature-title">Smart Search</h3>
                <p className="feature-description">
                  Find bookmarks quickly with intelligent search that
                  understands your browsing patterns
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"></div>
                <h3 className="feature-title">Organized</h3>
                <p className="feature-description">
                  Automatically organize bookmarks with tags and categories that
                  make sense
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="whats-inside">
          <div className="container">
            <h2 className="whats-inside-title">What's Inside?</h2>
            <div className="inside-grid">
              <div className="inside-card">
                <h3 className="inside-card-title">Floating Modal</h3>
                <p className="inside-card-description">
                  Click the extension icon to open a draggable modal that
                  overlays on any webpage — no popup windows or new tabs.
                </p>
                <div className="inside-placeholder">Floating Modal Preview</div>
              </div>
              <div className="inside-card">
                <h3 className="inside-card-title">Quick Add</h3>
                <p className="inside-card-description">
                  Add bookmarks instantly with one click, complete with
                  automatic title detection and smart categorization.
                </p>
                <div className="inside-placeholder">Quick Add Interface</div>
              </div>
              <div className="inside-card">
                <h3 className="inside-card-title">Drag & Drop</h3>
                <p className="inside-card-description">
                  Move the modal anywhere on the page and organize your
                  bookmarks with intuitive drag-and-drop functionality.
                </p>
                <div className="inside-placeholder">Drag & Drop Demo</div>
              </div>
              <div className="inside-card">
                <h3 className="inside-card-title">Search & Filter</h3>
                <p className="inside-card-description">
                  Find what you need fast with powerful search and filtering
                  options that work across titles, URLs, and tags.
                </p>
                <div className="inside-placeholder">Search Interface</div>
              </div>
            </div>
          </div>
        </section>

        <section id="install" className="installation-guide">
          <div className="container">
            <h2 className="installation-title">Get Started!</h2>
            <div className="installation-steps">
              <div className="step">
                <div className="step-number">Step 1</div>
                <h3 className="step-title">Download the Extension</h3>
                <p className="step-description">
                  Visit the Chrome Web Store and click "Add to Chrome" to
                  install Safis.
                </p>
              </div>
              <div className="step">
                <div className="step-number">Step 2</div>
                <h3 className="step-title">Pin the Extension</h3>
                <p className="step-description">
                  Click the puzzle piece icon in Chrome and pin Safis to your
                  toolbar for easy access.
                </p>
              </div>
              <div className="step">
                <div className="step-number">Step 3</div>
                <h3 className="step-title">Start Bookmarking</h3>
                <p className="step-description">
                  Click the Safis icon on any webpage to open the floating modal
                  and start managing your bookmarks.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <h2 className="cta-title">Let's Get Started!</h2>
            <p className="cta-description">
              Download Safis now and start tracking your bookmarks with ease. No
              accounts. No cloud. No noise — just simple bookmark tracking that
              lets you focus on your work.
            </p>
            <a href="#install" className="btn-primary">
              Download for Chrome
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
