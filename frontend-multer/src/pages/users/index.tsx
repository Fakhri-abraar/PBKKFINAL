import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { User } from '../../types';

export default function UserSearch() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    try {
      // Panggil endpoint users (backend-multer/src/users/users.controller.ts)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mt-4" style={{ maxWidth: '800px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Find Friends</h2>
          <Link href="/" className="btn btn-outline-secondary">
            Back to Dashboard
          </Link>
        </div>

        {/* Search Bar */}
        <div className="card p-4 shadow-sm mb-4">
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by username..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Results List */}
        <div className="list-group">
          {results.map((user) => (
            <div key={user.username} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{user.username}</h5>
                <small className="text-muted">{user.email}</small>
              </div>
              <Link href={`/users/${user.username}`} className="btn btn-sm btn-info text-white">
                View Public Tasks
              </Link>
            </div>
          ))}

          {hasSearched && results.length === 0 && !loading && (
            <div className="text-center text-muted p-3">
              No users found matching "{search}".
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}