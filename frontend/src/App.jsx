import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [issue, setIssue] = useState("");
  const [result, setResult] = useState(null);
  const [tickets, setTickets] = useState([]);

  // NEW FILTER STATES
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const analyzeIssue = async () => {
    const res = await axios.post("http://127.0.0.1:8000/predict", {
      issue,
    });

    setResult(res.data);
    fetchTickets();
    setIssue("");
  };

  const fetchTickets = async () => {
    const res = await axios.get("http://127.0.0.1:8000/tickets");
    setTickets(res.data);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#ff4d4d";
      case "Medium":
        return "#ffa500";
      default:
        return "#4caf50";
    }
  };

  // FILTER LOGIC (IMPORTANT)
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.issue.toLowerCase().includes(search.toLowerCase());

    const matchesPriority =
      priorityFilter === "All" || t.priority === priorityFilter;

    const matchesCategory =
      categoryFilter === "All" || t.category === categoryFilter;

    return matchesSearch && matchesPriority && matchesCategory;
  });

  return (
    <div className="container">
      <h1 className="title">FixPilot AI Dashboard</h1>

      {/* INPUT SECTION */}
      <div className="inputCard">
        <textarea
          placeholder="Describe your issue..."
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        />

        <button onClick={analyzeIssue}>Analyze Issue</button>
      </div>

      {/* RESULT */}
      {result && (
        <div className="resultCard">
          <h2>Latest AI Result</h2>
          <p><b>Category:</b> {result.category}</p>
          <p>
            <b>Priority:</b>{" "}
            <span style={{ color: getPriorityColor(result.priority) }}>
              {result.priority}
            </span>
          </p>
        </div>
      )}

      {/* FILTER SECTION */}
      <div className="filterBar">
        <input
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Bug">Bug</option>
          <option value="Backend">Backend</option>
          <option value="UI">UI</option>
          <option value="Database">Database</option>
          <option value="Performance">Performance</option>
        </select>
      </div>

      {/* TICKETS */}
      <h2 className="sectionTitle">Tickets</h2>

      <div className="grid">
        {filteredTickets.map((t) => (
          <div key={t.id} className="card">
            <div className="cardHeader">
              <span className="ticketId">#{t.id}</span>
              <span
                className="badge"
                style={{ background: getPriorityColor(t.priority) }}
              >
                {t.priority}
              </span>
            </div>

            <p className="issueText">{t.issue}</p>

            <div className="category">{t.category}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;