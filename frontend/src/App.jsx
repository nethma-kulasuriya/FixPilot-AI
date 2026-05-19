import { useState, useEffect } from "react";
import api from "./api";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [issue, setIssue] = useState("");

  const [tickets, setTickets] = useState([]);

  const [isLogin, setIsLogin] = useState(true);

  // ---------------- AUTH ----------------

  const register = async () => {
    try {
      const res = await api.post("/register", null, {
        params: { email, password },
      });

      console.log(res.data);
      alert("User created!");
      setIsLogin(true);

    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(error.response.data.detail || "Register failed");
      } else {
        alert("Server error");
      }
    }
  };

  const login = async () => {
    try {
      const res = await api.post("/login", null, {
        params: { email, password },
      });

      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        setToken(res.data.access_token);
      } else {
        alert("Login failed");
      }

    } catch (error) {
      console.error(error);
      alert("Login error");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  // ---------------- AI ----------------

  const analyzeIssue = async () => {
    await api.post("/predict", { issue });
    setIssue("");
    fetchTickets();
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token]);

  // ---------------- UI ----------------

  if (!token) {
    return (
      <div className="container">
        <h1>FixPilot AI Login</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />

        {isLogin ? (
          <>
            <button onClick={login}>Login</button>
            <p onClick={() => setIsLogin(false)}>Create account</p>
          </>
        ) : (
          <>
            <button onClick={register}>Register</button>
            <p onClick={() => setIsLogin(true)}>Back to login</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container">

      <h1>FixPilot AI Dashboard</h1>

      <button onClick={logout}>Logout</button>

      <div className="inputCard">
        <textarea
          placeholder="Describe issue..."
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        />

        <button onClick={analyzeIssue}>Analyze</button>
      </div>

      <h2>Your Tickets</h2>

      <div className="grid">
        {tickets.map((t) => (
          <div key={t.id} className="card">

            <p>{t.issue}</p>
            <b>{t.category} - {t.priority}</b>

            {/* ✅ NEW DELETE BUTTON */}
            <button
              style={{
                marginTop: "10px",
                background: "red",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer"
              }}
              onClick={async () => {
                try {
                  await api.delete(`/ticket/${t.id}`);
                  fetchTickets(); // refresh UI instantly
                } catch (err) {
                  console.error(err);
                  alert("Delete failed");
                }
              }}
            >
              Delete
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}

export default App;