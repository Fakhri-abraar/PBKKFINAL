import type { AppProps } from "next/app";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider } from "../contexts/AuthContext";

function AppContent({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Global Styles untuk Tema Angkasa */}
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: #e0e0e0;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          border-radius: 10px;
          color: white;
        }
        .form-control, .form-select {
          background-color: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }
        .form-control:focus, .form-select:focus {
          background-color: rgba(0, 0, 0, 0.5) !important;
          border-color: #80bdff !important;
          box-shadow: 0 0 0 0.25rem rgba(0, 123, 255, 0.25) !important;
        }
        .form-control::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #0f0c29; 
        }
        ::-webkit-scrollbar-thumb {
          background: #302b63; 
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555; 
        }
      `}</style>

      {/* Navigation dihapus sesuai permintaan */}
      
      <div className="container mt-5">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}