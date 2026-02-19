import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { LanguageProvider } from "./hooks/useLanguage.tsx";
import "./index.css";

console.log("[main.tsx] Starting application...");

try {
  const rootElement = document.getElementById("root");
  console.log("[main.tsx] Root element:", rootElement);
  
  if (!rootElement) {
    throw new Error("Root element not found!");
  }
  
  const root = createRoot(rootElement);
  console.log("[main.tsx] Root created, rendering...");
  
  root.render(
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  );
  console.log("[main.tsx] Render completed");
} catch (error) {
  console.error("[main.tsx] Fatal error:", error);
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif;">
      <h1 style="color: #dc2626;">Application Error</h1>
      <p style="color: #666;">${error instanceof Error ? error.message : String(error)}</p>
      <pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; overflow: auto;">${error instanceof Error ? error.stack : 'No stack trace'}</pre>
    </div>
  `;
}
