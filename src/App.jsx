import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./Login";
import Register from "./Register";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app">

      <nav className="navbar">

        <div className="logo">
          Smart Complaint Management System
        </div>

        <div className="nav-links">

          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>

          <button
            className="login-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="register-btn"
            onClick={() => navigate("/register")}
          >
            Register
          </button>

        </div>

      </nav>

      <section className="hero" id="home">

        <div className="hero-content">

          <h1>
            Smart Complaint
            <br />
            Management System
          </h1>

          <p>
            Submit complaints easily, track their status,
            and get faster resolutions through one smart platform.
          </p>

          <div className="hero-buttons">

            <button className="primary-btn">
              Submit Complaint
            </button>

            <button className="secondary-btn">
              Track Complaint
            </button>

          </div>

        </div>

        <div className="hero-card">

          <div className="card-icon">📋</div>

          <h2>Manage Complaints Easily</h2>

          <p>
            A simple and efficient platform for submitting,
            tracking and resolving complaints.
          </p>

          <div className="status-box">

            <span>Complaint Status</span>

            <strong>In Progress</strong>

          </div>

        </div>

      </section>

      <section className="features" id="features">

        <h2>Why Choose Our System?</h2>

        <div className="feature-container">

          <div className="feature-card">

            <div className="feature-icon">📝</div>

            <h3>Easy Complaint Submission</h3>

            <p>
              Submit your complaint quickly with a simple
              and user-friendly form.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">📊</div>

            <h3>Track Complaints</h3>

            <p>
              Track the status of your complaints from
              submission to resolution.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">⚡</div>

            <h3>Faster Resolution</h3>

            <p>
              Help administrators manage and resolve
              complaints efficiently.
            </p>

          </div>

        </div>

      </section>

      <section className="about" id="about">

        <h2>About the System</h2>

        <p>
          The Smart Complaint Management System is a web-based
          platform designed to make complaint registration,
          tracking and resolution simple, transparent and efficient.
        </p>

      </section>

      <footer>
        <p>© 2026 Smart Complaint Management System</p>
      </footer>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;