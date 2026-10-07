import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-page">

      <div className="login-box">

        <h1>Welcome Back</h1>

        <p className="login-subtitle">
          Login to Smart Complaint Management System
        </p>

        <form>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
          />

          <button
            type="submit"
            className="login-submit"
          >
            Login
          </button>

        </form>

        <p className="register-text">
          Don't have an account?

          <button
            type="button"
            className="register-link"
            onClick={() => navigate("/register")}
          >
            Register
          </button>

        </p>

      </div>

    </div>
  );
}

export default Login;