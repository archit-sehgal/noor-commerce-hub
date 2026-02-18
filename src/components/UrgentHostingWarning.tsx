import React, { useState, useEffect } from "react";

const UrgentHostingWarning: React.FC = () => {
  const [visible, setVisible] = useState(true);

  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        {/* Close Button */}
        <button style={closeStyle} onClick={() => setVisible(false)}>
          ×
        </button>

        {/* Branding */}
        <div style={brandingStyle}>
          ▲ VERCEL CLOUD INFRASTRUCTURE
        </div>

        <p style={textStyle}>
          Your cloud hosting credits are nearing exhaustion.
          <br /><br />
          To prevent service interruption or permanent project suspension,
          please renew your hosting plan immediately.
        </p>

        <div style={dividerStyle} />

        <div style={pricingStyle}>
          <p><strong>Annual Plan:</strong> $210 / year</p>
          <p>
            <strong>3-Year Plan:</strong> $199 / year + 1 year Free
            <br />
          </p>
        </div>

        <div style={footerStyle}>
          Immediate action is strongly recommended.
        </div>
      </div>
    </div>
  );
};

export default UrgentHostingWarning;

/* ---------- Styles ---------- */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999999,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const dialogStyle: React.CSSProperties = {
  position: "relative",
  background: "#ffffff",
  width: "460px",
  padding: "40px",
  borderRadius: "12px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  textAlign: "center",
};

const closeStyle: React.CSSProperties = {
  position: "absolute",
  top: "16px",
  right: "18px",
  border: "none",
  background: "transparent",
  fontSize: "20px",
  cursor: "pointer",
  color: "#000",
};

const brandingStyle: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "1.5px",
  fontWeight: 600,
  marginBottom: "25px",
  color: "#000",
};

const titleStyle: React.CSSProperties = {
  color: "#d00000",
  fontSize: "20px",
  fontWeight: 700,
  marginBottom: "20px",
  letterSpacing: "1px",
};

const textStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.7",
  color: "#000",
  marginBottom: "25px",
};

const dividerStyle: React.CSSProperties = {
  height: "1px",
  backgroundColor: "#e5e5e5",
  margin: "20px 0",
};

const pricingStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.8",
  color: "#000",
};

const footerStyle: React.CSSProperties = {
  marginTop: "25px",
  fontSize: "13px",
  fontWeight: 500,
  color: "#000",
};
