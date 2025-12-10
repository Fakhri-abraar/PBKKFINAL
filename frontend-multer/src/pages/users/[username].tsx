import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Task } from '../../types';

export default function PublicUserProfile() {
  const router = useRouter();
  const { username } = router.query; // Ambil username dari URL
  const { token } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username || !token) return;

    const fetchPublicTasks = async () => {
      try {
        // Panggil endpoint public tasks
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/public/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        } else {
          // Jika user tidak ditemukan atau error lain
          setTasks([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicTasks();
  }, [username, token]);

  if (loading) return <div className="container mt-4 text-center">Loading profile...</div>;

  return (
    <ProtectedRoute>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-0">User: {username}</h2>
            <p className="text-muted">Viewing public tasks list</p>
          </div>
          <Link href="/users" className="btn btn-secondary">
            Back to Search
          </Link>
        </div>

        {/* Task List (Read Only) */}
        <div className="list-group">
          {tasks.map(task => (
            <div key={task.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">
                    {task.title}
                    <span className={`badge ms-2 ${task.priority === 'High' ? 'bg-danger' : task.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {task.priority}
                    </span>
                    {task.category && <span className="badge bg-info text-dark ms-1">{task.category.name}</span>}
                  </h5>
                  <p className="mb-1 text-muted">{task.description}</p>
                  
                  {/* Attachment Link */}
                  {task.fileUrl && (
                    <div className="mt-2">
                       <a href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${task.fileUrl}`} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                        📎 View Attachment
                      </a>
                    </div>
                  )}
                </div>
                
                <small className="text-muted">Due: {new Date(task.dueDate).toLocaleDateString()}</small>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="alert alert-info text-center">
              {username} has no public tasks visible.
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}