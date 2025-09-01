import React, { useState } from "react";
import glassesLogo from "./assets/glasses_emoji.png";
import { EMAIL_CONFIG } from "./config";

function App() {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    {
      id: 1,
      question: "How does Safis work?",
      answer: "Safis is a Chrome extension that adds a floating bookmark modal to any webpage. Simply press Ctrl+Shift+B (or Cmd+Shift+B on Mac) to open the bookmark manager overlay."
    },
    {
      id: 2,
      question: "Is my data safe?",
      answer: "Yes! Safis stores all your bookmarks locally in your browser. No data is sent to external servers or the cloud. Your bookmarks stay private and secure on your device."
    },
    {
      id: 3,
      question: "Can I sync bookmarks across devices?",
      answer: "Currently, Safis focuses on local storage for privacy and security. Cloud sync features may be considered for future versions based on user feedback."
    },
    {
      id: 4,
      question: "Does Safis work on all websites?",
      answer: "Safis works on most websites. However, some sites with strict security policies (like banking sites) may restrict extensions for security reasons."
    },
    {
      id: 5,
      question: "Is Safis free?",
      answer: "Yes, Safis is completely free to use. No subscriptions, no hidden costs, just a simple bookmark manager for busy professionals."
    }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setIsSubmitting(true);
    
    // Simple mailto fallback - you can replace this with your email service
    const subject = encodeURIComponent('Feedback for Safis Bookmark Manager');
    const body = encodeURIComponent(feedbackMessage);
    window.open(`mailto:${EMAIL_CONFIG.feedbackEmail}?subject=${subject}&body=${body}`, '_blank');
    
    setFeedbackMessage('');
    setShowFeedbackModal(false);
    setIsSubmitting(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFeedbackSubmit(e);
    }
  };

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
            <div className="demo-video">
              <video 
                autoPlay 
                muted 
                loop
                playsInline
                className="demo-recording"
                poster=""
              >
                <source src="./dist/assets/demo.mov" type="video/quicktime" />
                <source src="./dist/assets/demo.mov" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

      

        <section className="faq-section">
          <div className="container">
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqs.map((faq) => (
                <div key={faq.id} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={expandedFAQ === faq.id}
                  >
                    <span>{faq.question}</span>
                    <span className={`faq-icon ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
                      +
                    </span>
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
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

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <a href="#" className="footer-logo">
                Safis
              </a>
              <p className="footer-description">
                Simple bookmark management for busy professionals.
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#install">Download</a>
                <a href="#demo">Demo</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#contact">Contact</a>
                <a href="#privacy">Privacy</a>
                <a href="#terms">Terms</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Safis. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <button
        className="feedback-button"
        onClick={() => setShowFeedbackModal(true)}
        title="Send Feedback"
      >
        Feedback
      </button>

      {showFeedbackModal && (
        <div className="feedback-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h3>Send Feedback</h3>
              <button 
                className="feedback-modal-close"
                onClick={() => setShowFeedbackModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit}>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Share your thoughts about Safis..."
                className="feedback-textarea"
                rows="4"
                autoFocus
              />
              <div className="feedback-modal-actions">
                <button 
                  type="button" 
                  className="feedback-cancel"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="feedback-submit"
                  disabled={!feedbackMessage.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
