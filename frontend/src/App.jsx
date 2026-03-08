import { useState } from "react";
import "./index.css";

function App() {
  const [data, setData] = useState(null);
  const [ipInput, setIpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkIp = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = ipInput
        ? `http://localhost:3000/checkip?ip=${ipInput}`
        : "http://localhost:3000/checkip";

      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Rate limit exceeded. Try again later.");
        }
        throw new Error("Failed to fetch Security Profile DATA.");
      }

      const jsonData = await res.json();
      setData(jsonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getThreatBadge = (score, errorText) => {
    if (errorText) return <span className="badge warning">No API Key</span>;
    if (score > 50) return <span className="badge danger">Malicious</span>;
    if (score > 10) return <span className="badge warning">Suspicious</span>;
    return <span className="badge safe">Clean</span>;
  };

  const getBotBadge = (isBot) => {
    if (isBot) return <span className="badge bot">Bot</span>;
    return <span className="badge safe">Human</span>;
  };

  return (
    <div className="dashboard-container">

      <div className="header">
        <h1>🛡 GuardianX</h1>
        <p>Enterprise IP Intelligence & Fraud Detection</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter IP (8.8.8.8) or leave blank"
          value={ipInput}
          onChange={(e) => setIpInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && checkIp()}
        />
        <button onClick={checkIp} disabled={loading}>
          {loading ? "Scanning..." : "Analyze"}
        </button>
      </div>

      {error && <div className="error">⚠ {error}</div>}

      {(loading || data) && (
        <div className="bento-grid">

          {/* PROFILE */}
          <div className="card span-2">
            <div className="card-header">📍 Profile Identification</div>

            <div className="card-value">{loading ? "..." : data?.ip}</div>

            <div className="card-subtext">
              {data?.isMe ? "Your Connection" : "Remote Address"}
              {data && getBotBadge(data?.botDetection?.isBot)}
            </div>

            {data?.botDetection?.isBot && (
              <div className="ua-box">
                {data.botDetection.userAgent}
              </div>
            )}
          </div>

          {/* THREAT */}
          <div className="card">
            <div className="card-header">🚨 Threat Score</div>

            {loading ? (
              <div className="card-value">...</div>
            ) : (
              <>
                <div className="card-value score">
                  {data?.threatIntelligence?.error
                    ? "N/A"
                    : `${data?.threatIntelligence?.abuseConfidenceScore}%`}

                  {getThreatBadge(
                    data?.threatIntelligence?.abuseConfidenceScore,
                    data?.threatIntelligence?.error
                  )}
                </div>

                <div className="row">
                  <span>Reports</span>
                  <span>{data?.threatIntelligence?.totalReports ?? 0}</span>
                </div>

                <div className="row">
                  <span>Type</span>
                  <span>
                    {data?.threatIntelligence?.usageType ?? "Unknown"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* GEO */}
          <div className="card">
            <div className="card-header">🌍 Geo Location</div>

            {loading ? (
              <div className="card-value">...</div>
            ) : (
              <>
                <div className="card-value city">
                  {data?.geolocation?.city || "Unknown"}
                </div>

                <div className="row">
                  <span>Region</span>
                  <span>{data?.geolocation?.region}</span>
                </div>

                <div className="row">
                  <span>Country</span>
                  <span>{data?.geolocation?.country}</span>
                </div>

                <div className="row">
                  <span>Coordinates</span>
                  <span>{data?.geolocation?.location}</span>
                </div>
              </>
            )}
          </div>

          {/* NETWORK */}
          <div className="card span-2">
            <div className="card-header">📡 Network & ASN Data</div>

            {loading ? (
              <div className="card-value">...</div>
            ) : (
              <>
                <div className="card-value">
                  {data?.network?.org}
                </div>

                <div className="row">
                  <span>ISP</span>
                  <span>{data?.threatIntelligence?.isp || "Unknown"}</span>
                </div>

                <div className="row">
                  <span>Timezone</span>
                  <span>{data?.network?.timezone}</span>
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default App;