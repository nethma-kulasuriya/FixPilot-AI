import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [issue, setIssue] = useState("");
  const [result, setResult] = useState(null);
  const [tickets, setTickets] = useState([]);

  // Call AI prediction
  const analyzeIssue = async () => {
    const res = await axios.post("http://127.0.0.1:8000/predict", {
      issue: issue,
    });

    setResult(res.data);
    fetchTickets();
  };

  // Fetch saved tickets
  const fetchTickets = async () => {
    const res = await axios.get("http://127.0.0.1:8000/tickets");
    setTickets(res.data);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>FixPilot AI Dashboard</h1>

      <textarea
        rows="4"
        cols="50"
        placeholder="Enter issue..."
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
      />

      <br />

      <button onClick={analyzeIssue}>Analyze</button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>AI Result</h2>
          <p>Category: {result.category}</p>
          <p>Priority: {result.priority}</p>
        </div>
      )}

      <hr />

      <h2>Saved Tickets</h2>

      <ul>
        {tickets.map((t) => (
          <li key={t.id}>
            #{t.id} - {t.issue} ({t.category}, {t.priority})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;