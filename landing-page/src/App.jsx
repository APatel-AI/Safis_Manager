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
            <h4>It's simply a</h4>
            <h1>Bookmark manager</h1>
            <p className="hero-subtitle">
              For busy proffesionals with a lot of useful digital resources to keep handy.
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
