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

  const [editingTicket, setEditingTicket] = useState(null);
  const [editText, setEditText] = useState("");

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

      console.log("LOGIN RESPONSE:", res.data);

      if (!res.data.access_token) {
        alert("Login failed: No token received");
        return;
      }

      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);

      // 🔥 FORCE reload data after login
      fetchTickets();

    } catch (error) {
      console.error("LOGIN ERROR:", error);
      alert("Login failed (check backend)");
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

      console.log("TICKETS:", res.data);

      setTickets(res.data);

    } catch (err) {
      console.error("FETCH TICKETS ERROR:", err);
      setTickets([]);
    }
  };

  const updateTicket = async (id) => {
    try {
      await api.put(`/ticket/${id}`, {
        issue: editText,
      });

      setEditingTicket(null);
      setEditText("");
      fetchTickets();

    } catch (err) {
      console.error(err);
      alert("Update failed");
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

            {/* EDIT MODE */}
            {editingTicket === t.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />

                <button onClick={() => updateTicket(t.id)}>
                  Save
                </button>

                <button onClick={() => setEditingTicket(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingTicket(t.id);
                  setEditText(t.issue);
                }}
              >
                Edit
              </button>
            )}

            {/* DELETE */}
            <button
              style={{ marginLeft: "10px", background: "red", color: "white" }}
              onClick={async () => {
                await api.delete(`/ticket/${t.id}`);
                fetchTickets();
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