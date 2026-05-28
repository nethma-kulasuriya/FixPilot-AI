
import { useState, useEffect } from "react";
import api from "./api";
import "./App.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { FiEdit3, FiTrash2 } from "react-icons/fi";
import Landing from "./Landing";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [issue, setIssue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [tickets, setTickets] = useState([]);
  const [isLogin, setIsLogin] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTickets, setAdminTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  const [hoveredTicket, setHoveredTicket] = useState(null);
  const [hoveredAdminTicket, setHoveredAdminTicket] = useState(null);

  // State variables for managing inline ticket editing
  const [editingTicket, setEditingTicket] = useState(null);
  const [editText, setEditText] = useState("");



  // ---------------- AUTH ----------------

  const register = async () => {
    try {
      await api.post("/register", null, {
        params: { email, password },
      });

      alert("User created!");
      setIsLogin(true);

    } catch (error) {
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

    } catch {
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

  // ---------------- USER ----------------

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch {
      setTickets([]);
    }
  };

  const analyzeIssue = async () => {
    try {
      const res = await api.post("/predict", { issue });

      alert("AI Suggestion:\n\n" + res.data.suggested_fix);

      setIssue("");
      fetchTickets();

    } catch {
      alert("AI prediction failed");
    }
  };

  const deleteTicket = async (id) => {
    await api.delete(`/ticket/${id}`);
    fetchTickets();
  };

  const updateStatus = async (ticketId, newStatus) => {
    try {
      await api.put(
        `/ticket-status/${ticketId}?status=${newStatus}`
      );

      fetchAdminData();
      fetchTickets();

    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  // Fixed and moved outside the unreachable login check block
  const saveEdit = async (id) => {
    try {
      await api.put(`/ticket/${id}`, {
        issue: editText,
      });

      setEditingTicket(null);
      setEditText("");

      fetchTickets();
      fetchAdminData();

    } catch (err) {
      console.error(err);
      alert("Failed to update ticket");
    }
  };

  // ---------------- ADMIN ----------------

  const fetchAdminData = async () => {
    try {
      const usersRes = await api.get("/admin/users");
      const ticketsRes = await api.get("/admin/tickets");
      const statsRes = await api.get("/admin/stats");

      setIsAdmin(true);
      console.log("ADMIN API SUCCESS ✔");
      setAdminUsers(usersRes.data || []);
      setAdminTickets(ticketsRes.data || []);
      setStats(statsRes.data || null);

    } catch {
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

  useEffect(() => {
    console.log("IS ADMIN:", isAdmin);
  }, [isAdmin]);

  const filteredTickets = tickets.filter((t) =>
    t.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // ---------------- CHART DATA ----------------
  const chartData = [
    { name: "Users", value: adminUsers?.length || 0 },
    { name: "Tickets", value: tickets?.length || 0 },
    { name: "High Priority", value: stats?.high_priority || 0 }
  ];

  // ---------------- LOGIN PAGE ----------------

  if (!token) {
    if (!showAuth) {
      return <Landing onLoginClick={() => setShowAuth(true)} />;
    }

    return (
      <div className="auth-overlay">
        <div className="auth-modal glass-card">
          <button className="auth-close-btn" onClick={() => setShowAuth(false)}>&times;</button>
          <div className="auth-logo-container">
            <img src="/logo.png" alt="FixPilot Logo" className="auth-logo" />
          </div>
          <h2 className="auth-title">Welcome to FixPilot-AI</h2>
          <p className="auth-subtitle">{isLogin ? "Sign in to your account" : "Create a new account"}</p>

          <div className="auth-form">
            <input
              className="auth-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="auth-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {isLogin ? (
              <>
                <button className="auth-submit-btn" onClick={login}>Sign In</button>
                <p className="auth-switch-text">
                  Don't have an account? <span onClick={() => setIsLogin(false)}>Sign up</span>
                </p>
              </>
            ) : (
              <>
                <button className="auth-submit-btn" onClick={register}>Create Account</button>
                <p className="auth-switch-text">
                  Already have an account? <span onClick={() => setIsLogin(true)}>Sign in</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- MAIN UI ----------------

  if (activePage === "landing") {
    return <Landing onLoginClick={() => setActivePage("dashboard")} isAuthenticated={true} />;
  }

  return (
    <div className="layout">

      {/* SIDEBAR */}
      <div className="sidebar">

        <h2 className="sidebar-brand" onClick={() => setActivePage("landing")}>
          <img src="/logo.png" alt="FixPilot Logo" className="sidebar-logo" />
          <span>FixPilot-AI</span>
        </h2>

        <button onClick={() => setActivePage("dashboard")}>
          Dashboard
        </button>

        <button onClick={() => setActivePage("tickets")}>
          Tickets
        </button>

        <button
          onClick={() => setActivePage("admin")}
          disabled={!isAdmin}
        >
          Admin
        </button>

        <button onClick={logout}>
          Logout
        </button>

      </div>

      {/* MAIN CONTENT */}
      <div className="main">

        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <div>

            <h1>Dashboard</h1>

            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* TICKETS */}
        {activePage === "tickets" && (
          <div>

            <h1>Your Tickets</h1>
            <div className="searchBar">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="inputCard">
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="Describe issue..."
              />

              <button onClick={analyzeIssue}>
                Analyze
              </button>
            </div>

            <div className="grid">

              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  className="card"
                  onMouseEnter={() => setHoveredTicket(t.id)}
                  onMouseLeave={() => setHoveredTicket(null)}
                >

                  {editingTicket === t.id ? (
                    <div className="editContainer">
                      <textarea
                        className="editInput"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{ width: "100%", minHeight: "60px", marginBottom: "8px" }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => saveEdit(t.id)} className="saveBtn">
                          Save
                        </button>
                        <button onClick={() => setEditingTicket(null)} className="cancelBtn">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="ticket-issue">
                        {t.issue}
                      </p>

                      <div className="ticketBottom">

                        <b className="ticket-meta">
                          {t.category} - {t.priority}
                        </b>

                        <span className={`statusBadge status-${t.status?.toLowerCase().replace(" ", "")}`}>
                          {t.status}
                        </span>

                      </div>

                      <div className={`iconRow ${hoveredTicket === t.id ? "show" : ""}`}>

                        <button
                          className="iconBtn"
                          onClick={() => {
                            setEditingTicket(t.id);
                            setEditText(t.issue);
                          }}
                        >
                          <FiEdit3 />
                        </button>

                        <button
                          className="iconBtn danger"
                          onClick={() => deleteTicket(t.id)}
                        >
                          <FiTrash2 />
                        </button>

                      </div>
                    </>
                  )}

                </div>
              ))}

            </div>

          </div>
        )}

        {/* ADMIN */}
        {activePage === "admin" && isAdmin && (
          <div>

            <h1 className="pageTitle">
              Admin Panel
            </h1>

            {/* USERS */}
            <h3 className="sectionLabel">
              Users
            </h3>

            <div className="usersTable">

              <div className="usersHeader">
                <span>User</span>
                <span>Role</span>
                <span>Status</span>
              </div>

              {adminUsers.map((u) => (
                <div key={u.id} className="userRow">

                  <div className="userInfo">

                    <div className="avatar">
                      {u.email.charAt(0).toUpperCase()}
                    </div>

                    <div className="userText">

                      <p className="userEmail">
                        {u.email}
                      </p>

                      <small className="userSubText">
                        Active account
                      </small>

                    </div>

                  </div>

                  <div>
                    <span className={u.is_admin ? "roleAdmin" : "roleUser"}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </div>

                  <div>
                    <span className="statusBadge">
                      Online
                    </span>
                  </div>

                </div>
              ))}

            </div>

            {/* TICKETS */}
            <h3 className="sectionLabel ticketsLabel">
              Tickets
            </h3>

            <div className="grid">

              {adminTickets.map((t) => (
                <div
                  key={t.id}
                  className="card adminCard"
                  onMouseEnter={() => setHoveredAdminTicket(t.id)}
                  onMouseLeave={() => setHoveredAdminTicket(null)}
                >

                  <p className="ticket-issue">
                    {t.issue}
                  </p>

                  <div className="ticketBottom">

                    <b className="ticket-meta">
                      {t.category} - {t.priority}
                    </b>

                    <select
                      className="statusSelect"
                      value={t.status || "Open"}
                      onChange={(e) => updateStatus(t.id, e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>

                  </div>

                  {hoveredAdminTicket === t.id && (
                    <div className="adminEmail">
                      {t.owner}
                    </div>
                  )}

                </div>
              ))}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default App;