import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <div className="text-white text-center mt-5">Redirecting to command center...</div>;
  }

  return (
    <div className="row justify-content-center align-items-center" style={{minHeight: '80vh'}}>
      <div className="col-md-5">
        <div className="glass-card p-4">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-white">🔐 Space Access</h2>
            <p className="text-white-50">Identify yourself, Commander.</p>
          </div>
          
          <div className="card-body">
            {error && (
              <div className="alert alert-danger border-0" role="alert" style={{background: 'rgba(220, 53, 69, 0.8)', color: 'white'}}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label text-white">
                  Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  placeholder="Enter your ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label text-white">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder="Enter your secret code"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 fw-bold py-2"
                style={{background: 'linear-gradient(45deg, #4facfe, #00f2fe)', border: 'none'}}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Initialize Launch'}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="mb-0 text-white-50">
                New recruit?{' '}
                <a href="/auth/register" className="text-info text-decoration-none fw-bold">Register here</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}