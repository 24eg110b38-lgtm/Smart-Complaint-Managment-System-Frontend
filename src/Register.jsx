import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  return (
    <div className="register-page">

      <div className="register-box">

        <h1>Create Account</h1>

        <p className="register-subtitle">
          Register for Smart Complaint Management System
        </p>

        <form>

          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your full name"
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create a password"
          />

          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm your password"
          />

          <button
            type="submit"
            className="register-submit"
          >
            Create Account
          </button>

        </form>

        <p className="login-text">
          Already have an account?

          <button
            type="button"
            className="login-link"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

        </p>

      </div>

    </div>
  );
}

export default Register;