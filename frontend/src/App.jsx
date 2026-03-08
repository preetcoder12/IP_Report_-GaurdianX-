import { useState } from 'react';
import './index.css';

function App() {
  const [data, setData] = useState(null);
  const [ipInput, setIpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkIp = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = ipInput ? `http://localhost:3000/checkip?ip=${ipInput}` : "http://localhost:3000/checkip";
      
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Rate limit exceeded. Try again in a few seconds.");
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
    if (isBot) return <span className="badge bot">Bot Detected</span>;
    return <span className="badge safe">Human</span>;
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <div className="title-group">
          <h1>🛡️ GuardianX</h1>
          <p>Enterprise IP Intelligence & Fraud Detection</p>
        </div>
      </div>

      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Enter IP Address to scan (e.g. 8.8.8.8) or leave blank to scan yourself" 
          value={ipInput}
          onChange={(e) => setIpInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkIp()}
        />
        <button className="btn-scan" onClick={checkIp} disabled={loading}>
          {loading ? "Scanning..." : "Analyze"}
        </button>
      </div>

      {error && <div style={{ color: "var(--accent-red)", padding: "10px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", textAlign: "center" }}>⚠️ {error}</div>}

      {(loading || data) && (
        <div className="bento-grid" style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
          
          {/* Main Identifier Card */}
          <div className="card span-2" style={{ borderLeft: "4px solid var(--accent-cyan)"}}>
            <div className="card-header"><span className="card-icon">📍</span> Profile Identification</div>
            <div className="card-value">{loading ? "..." : data?.ip}</div>
            <div className="card-subtext" style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
              {data?.isMe ? "Your Connection" : "Remote Address"} 
              {data && getBotBadge(data?.botDetection?.isBot)}
            </div>
            {data && data.botDetection?.isBot && (
                <div style={{ marginTop: "12px", fontSize: "12px", fontFamily: "monospace", color: "var(--text-muted)", background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "6px" }}>
                  {data.botDetection.userAgent}
                </div>
            )}
          </div>

          {/* Threat Intelligence BENTO */}
          <div className="card" style={{ borderLeft: "4px solid var(--accent-purple)", background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(139, 92, 246, 0.05) 100%)" }}>
            <div className="card-header"><span className="card-icon">🚨</span> Threat Score</div>
            {loading ? <div className="card-value pulse">...</div> : (
              <>
                <div className="card-value" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {data?.threatIntelligence?.error ? "N/A" : `${data?.threatIntelligence?.abuseConfidenceScore}%`}
                  {getThreatBadge(data?.threatIntelligence?.abuseConfidenceScore, data?.threatIntelligence?.error)}
                </div>
                
                <div style={{ marginTop: "20px" }}>
                  <div className="row-data">
                    <span className="row-label">Reports</span>
                    <span className="row-val">{data?.threatIntelligence?.totalReports ?? 0}</span>
                  </div>
                  <div className="row-data">
                    <span className="row-label">Type</span>
                    <span className="row-val">{data?.threatIntelligence?.usageType ?? "Unknown"}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Geolocation BENTO */}
          <div className="card" style={{ borderLeft: "4px solid var(--accent-green)" }}>
            <div className="card-header"><span className="card-icon">🌍</span> Geo Location</div>
            {loading ? <div className="card-value pulse">...</div> : (
              <>
                <div className="card-value" style={{ fontSize: "20px" }}>{data?.geolocation?.city || "Unknown City"}</div>
                <div className="row-data" style={{ marginTop: "16px" }}>
                  <span className="row-label">Region</span>
                  <span className="row-val">{data?.geolocation?.region}</span>
                </div>
                <div className="row-data">
                  <span className="row-label">Country</span>
                  <span className="row-val">{data?.geolocation?.country}</span>
                </div>
                <div className="row-data">
                  <span className="row-label">Coordinates</span>
                  <span className="row-val">{data?.geolocation?.location}</span>
                </div>
              </>
            )}
          </div>

          {/* Network BENTO */}
          <div className="card span-2" style={{ borderLeft: "4px solid var(--accent-blue)" }}>
            <div className="card-header"><span className="card-icon">📡</span> Network & ASN Data</div>
            {loading ? <div className="card-value pulse">...</div> : (
              <>
                <div className="card-value" style={{ fontSize: "18px" }}>{data?.network?.org}</div>
                <div className="card-subtext">Internet Service Provider / Corporate Network</div>
                
                <div className="network-grid" style={{ marginTop: "20px" }}>
                  <div>
                    <div className="row-data">
                      <span className="row-label">Abuse ISP</span>
                      <span className="row-val">{data?.threatIntelligence?.isp || "Unknown"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="row-data">
                      <span className="row-label">Local Timezone</span>
                      <span className="row-val">{data?.network?.timezone}</span>
                    </div>
                  </div>
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
