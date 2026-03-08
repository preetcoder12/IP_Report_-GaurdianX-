import requestIp from "request-ip";
import geoip from "geoip-lite";
import { isbot } from "isbot";

export const checkip = async (req, res) => {
    try {
        // 1. Get the REAL IP Address
        let clientIp = requestIp.getClientIp(req);
        
        // If the user specified an IP manually, override the client IP
        const requestedIp = req.query.ip || clientIp;
        
        // Normalize localhost IPs for API requests
        let queryIp = requestedIp;
        if (queryIp === "::1" || queryIp === "127.0.0.1" || queryIp === "::ffff:127.0.0.1") {
            queryIp = ""; // Tell external APIs to use the server's public IP
        }

        // 2. Is this request from a Bot?
        const userAgent = req.get('User-Agent') || "";
        const isBot = isbot(userAgent);

        // 3. Fast Offline Geolocation (geoip-lite)
        const offlineGeo = geoip.lookup(queryIp || "8.8.8.8");

        // Prepare our parallel external requests
        const externalRequests = [];

        // 4. IPinfo.io for detailed ASN / Organization (VPN hint)
        externalRequests.push(
            fetch(`https://ipinfo.io/${queryIp}/json`)
                .then(res => res.json())
                .catch(() => null)
        );

        // 5. AbuseIPDB for Fraud / Attack detection
        const ABUSE_KEY = process.env.ABUSEIPDB_API_KEY || "YOUR_ABUSEIPDB_API_KEY";
        externalRequests.push(
            fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${queryIp || "8.8.8.8"}`, {
                headers: {
                    'Key': ABUSE_KEY,
                    'Accept': 'application/json'
                }
            }).then(res => res.json()).catch(() => null)
        );

        // Wait for all external intelligence to finish
        const [ipinfoData, abuseData] = await Promise.all(externalRequests);

        // The resolved IP from ipinfo or fallback
        const targetIp = (ipinfoData && ipinfoData.ip) || queryIp || "8.8.8.8";

        // Build the Intelligence Payload
        const securityProfile = {
            ip: targetIp,
            isMe: !req.query.ip, // Boolean indicating if this is the requester's IP
            botDetection: {
                isBot: isBot,
                userAgent: userAgent
            },
            geolocation: {
                country: (ipinfoData && ipinfoData.country) || (offlineGeo && offlineGeo.country) || "Unknown",
                region: (ipinfoData && ipinfoData.region) || (offlineGeo && offlineGeo.region) || "Unknown",
                city: (ipinfoData && ipinfoData.city) || (offlineGeo && offlineGeo.city) || "Unknown",
                location: (ipinfoData && ipinfoData.loc) || (offlineGeo && `${offlineGeo.ll[0]},${offlineGeo.ll[1]}`) || "Unknown"
            },
            network: {
                org: (ipinfoData && ipinfoData.org) || "Unknown",
                timezone: (ipinfoData && ipinfoData.timezone) || (offlineGeo && offlineGeo.timezone) || "Unknown"
            },
            threatIntelligence: {
                abuseConfidenceScore: (abuseData && abuseData.data && abuseData.data.abuseConfidenceScore) || 0,
                totalReports: (abuseData && abuseData.data && abuseData.data.totalReports) || 0,
                usageType: (abuseData && abuseData.data && abuseData.data.usageType) || "Unknown",
                isp: (abuseData && abuseData.data && abuseData.data.isp) || "Unknown",
                error: (abuseData && abuseData.errors) ? abuseData.errors[0].detail : null
            }
        };

        res.json(securityProfile);
    } catch (error) {
        console.error("Error generating Intelligence Profile:", error);
        res.status(500).json({ error: "Failed to generate Intelligence Profile" });
    }
}