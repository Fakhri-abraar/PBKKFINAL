import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{minHeight: '80vh'}}>
        <div className="text-center">
          <div className="spinner-border text-info" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-white">Calibrating sensors...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning glass-card text-center border-warning">
          <h4 className="text-warning">⚠️ Access Denied</h4>
          <p className="text-white">You need to be logged in to access this sector.</p>
          <a href="/auth/login" className="btn btn-outline-warning mt-2">
            Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}