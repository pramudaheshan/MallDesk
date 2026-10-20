
import { useEffect, useState } from "react";
import { apiGet } from "./api/client";

type HealthResponse = {
  status: string;
  application: string;
};

function App() {
  const [message, setMessage] = useState("Connecting to Django...");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<HealthResponse>("/health/")
      .then((data) => {
        setMessage(`${data.application}: ${data.status}`);
      })
      .catch(() => {
        setError(
          "Could not connect to Django. Check that the backend is running."
        );
      });
  }, []);

  return (
    <main style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
      <h1>MallDesk</h1>
      <h2>Frontend and Backend Connection</h2>

      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p>{message}</p>
      )}
    </main>
  );
}

export default App;