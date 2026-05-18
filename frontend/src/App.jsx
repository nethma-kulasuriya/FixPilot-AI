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
    await api.post("/register", null, {
      params: { email, password },
    });

    alert("User created! Now login.");
    setIsLogin(true);
  };

  const login = async () => {
    const res = await api.post("/login", null, {
      params: { email, password },
    });

    localStorage.setItem("token", res.data.access_token);
    setToken(res.data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  // ---------------- AI ----------------

  const analyzeIssue = async () => {
    await api.post("/predict", {
      issue,
    });

    setIssue("");
    fetchTickets();
  };

  const fetchTickets = async () => {
    const res = await api.get("/tickets");
    setTickets(res.data);
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;