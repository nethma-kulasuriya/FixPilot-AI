import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [issue, setIssue] = useState("");
  const [result, setResult] = useState(null);
  const [tickets, setTickets] = useState([]);

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

  return (
    <div className="container">
      <h1 className="title">FixPilot AI Dashboard</h1>

      <div className="inputCard">
        <textarea
          placeholder="Describe your issue..."
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        />

        <button onClick={analyzeIssue}>Analyze Issue</button>
      </div>

      {result && (
        <div className="resultCard">
          <h2>Latest AI Result</h2>
          <p><b>Category:</b> {result.category}</p>
          <p>
            <b>Priority:</b>{" "}
            <span
              style={{
                color: getPriorityColor(result.priority),
                fontWeight: "bold",
              }}
            >
              {result.priority}
            </span>
          </p>
        </div>
      )}

      <h2 className="sectionTitle">Tickets</h2>

      <div className="grid">
        {tickets.map((t) => (
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

            <div className="category">
              {t.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;