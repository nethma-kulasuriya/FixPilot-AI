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

  // ADMIN STATE
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTickets, setAdminTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ---------------- AUTH ----------------

  const register = async () => {
    try {
      await api.post("/register", null, {
        params: { email, password },
      });

      alert("User created!");
      setIsLogin(true);

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Register failed");
    }
  };

  const login = async () => {
    try {
      const res = await api.post("/login", null, {
        params: { email, password },
      });

      if (!res.data.access_token) {
        alert("Login failed");
        return;
      }

      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);

    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);

    setTickets([]);
    setIsAdmin(false);
    setAdminUsers([]);
    setAdminTickets([]);
    setStats(null);
  };

  // ---------------- USER API ----------------

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch (err) {
      console.error(err);
      setTickets([]);
    }
  };

  const analyzeIssue = async () => {
    try {
      const res = await api.post("/predict", { issue });

      alert("AI Suggestion:\n\n" + res.data.suggested_fix);

      setIssue("");
      fetchTickets();

    } catch (err) {
      console.error(err);
      alert("AI prediction failed");
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

  // ---------------- ADMIN API ----------------

  const fetchAdminData = async () => {
    try {
      const usersRes = await api.get("/admin/users");
      const ticketsRes = await api.get("/admin/tickets");
      const statsRes = await api.get("/admin/stats");

      setIsAdmin(true);
      setAdminUsers(usersRes.data);
      setAdminTickets(ticketsRes.data);
      setStats(statsRes.data);

    } catch (err) {
      setIsAdmin(false);
    }
  };

  // ---------------- LOAD ----------------

  useEffect(() => {
    if (token) {
      fetchTickets();
      fetchAdminData();
    }
  }, [token]);

  // ---------------- LOGIN UI ----------------

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

  // ---------------- DASHBOARD UI ----------------

  return (
    <div className="container">

      <h1>FixPilot AI Dashboard</h1>

      <button onClick={logout}>Logout</button>

      {/* USER INPUT */}
      <div className="inputCard">
        <textarea
          placeholder="Describe issue..."
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        />

        <button onClick={analyzeIssue}>Analyze</button>
      </div>

      {/* USER TICKETS */}
      <h2>Your Tickets</h2>

      <div className="grid">
        {tickets.map((t) => (
          <div key={t.id} className="card">

            <p>{t.issue}</p>
            <b>{t.category} - {t.priority}</b>

            {editingTicket === t.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <button onClick={() => updateTicket(t.id)}>Save</button>
                <button onClick={() => setEditingTicket(null)}>Cancel</button>
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

      {/* ADMIN DASHBOARD */}
      {isAdmin && (
        <div className="adminPanel">

          <h2>👑 Admin Dashboard</h2>

          {/* STATS */}
          {stats && (
            <div className="statsGrid">

              <div className="statCard">
                <h3>{stats.users}</h3>
                <p>Total Users</p>
              </div>

              <div className="statCard">
                <h3>{stats.tickets}</h3>
                <p>Total Tickets</p>
              </div>

              <div className="statCard">
                <h3>{stats.high_priority}</h3>
                <p>High Priority</p>
              </div>

            </div>
          )}

          {/* USERS */}
          <h3>Users</h3>
          {adminUsers.map((u) => (
            <div key={u.id} className="card">
              <p>{u.email}</p>
              <small>{u.is_admin ? "Admin" : "User"}</small>
            </div>
          ))}

          {/* TICKETS */}
          <h3>All Tickets</h3>
          {adminTickets.map((t) => (
            <div key={t.id} className="card">
              <p>{t.issue}</p>
              <b>{t.category} - {t.priority}</b>
              <small>{t.owner}</small>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default App;