import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar Me Apunto"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#fff",
        borderRadius: 14,
        padding: "14px 18px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: 9999,
        border: "1px solid #e8d9c5",
        maxWidth: 360,
        width: "calc(100% - 40px)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "#916e3d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: 0.5,
        }}
      >
        MA
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>
          Instalar Me Apunto
        </div>
        <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
          Accede más rápido desde tu pantalla de inicio
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: "#916e3d",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Instalar
      </button>
      <button
        onClick={() => setVisible(false)}
        aria-label="Cerrar"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#aaa",
          fontSize: 22,
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
