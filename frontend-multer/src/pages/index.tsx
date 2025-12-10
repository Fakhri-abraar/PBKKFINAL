import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { Task, PaginationMeta, Category } from '../types';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Filter States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchCategories();
    }
  }, [token, page, priority, status, filterCat]); // Refetch saat filter berubah

  const fetchTasks = async () => {
    // Build query params
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '5', // 5 item per halaman
    });
    if (search) params.append('search', search);
    if (priority) params.append('priority', priority);
    if (status) params.append('status', status);
    if (filterCat) params.append('categoryId', filterCat);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTasks(data.data);
      setMeta(data.meta);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCategories(await res.json());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset ke halaman 1 saat search
    fetchTasks();
  };

  const toggleComplete = async (task: Task) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isCompleted: !task.isCompleted }),
    });
    if (res.ok) fetchTasks(); // Refresh list
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchTasks();
  };

  return (
    <ProtectedRoute>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>My Todo List</h1>
          <div>
            <span className="me-3">Hi, {user?.username}</span>
            <button className="btn btn-outline-danger btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="card p-3 mb-4 bg-light">
          <form onSubmit={handleSearch} className="row g-3">
            <div className="col-md-3">
              <input type="text" className="form-control" placeholder="Search title..." 
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-secondary flex-grow-1">Search</button>
              <Link href="/tasks/new" className="btn btn-primary flex-grow-1">
                + New Task
              </Link>
            </div>
          </form>
        </div>

        {/* Task List */}
        <div className="list-group mb-4">
          {tasks.map(task => (
            <div key={task.id} className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${task.isCompleted ? 'bg-light text-muted' : ''}`}>
              <div className="d-flex align-items-center gap-3">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  style={{transform: 'scale(1.3)'}}
                  checked={task.isCompleted} 
                  onChange={() => toggleComplete(task)} 
                />
                <div>
                  <h5 className={`mb-1 ${task.isCompleted ? 'text-decoration-line-through' : ''}`}>
                    {task.title}
                    {/* Badge Priority */}
                    <span className={`badge ms-2 ${task.priority === 'High' ? 'bg-danger' : task.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {task.priority}
                    </span>
                    {task.category && <span className="badge bg-info text-dark ms-1">{task.category.name}</span>}
                  </h5>
                  <small>Due: {new Date(task.dueDate).toLocaleDateString()}</small>
                  {task.fileUrl && (
                    <div className="mt-1">
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${task.fileUrl}`} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                        📎 View Attachment
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-center text-muted">No tasks found.</p>}
        </div>

        {/* Pagination */}
        {meta && (
          <div className="d-flex justify-content-center gap-2">
            <button 
              className="btn btn-outline-primary" 
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="align-self-center">
              Page {meta.page} of {meta.lastPage}
            </span>
            <button 
              className="btn btn-outline-primary" 
              disabled={page >= meta.lastPage}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}