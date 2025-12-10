import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Category } from '../../types';

export default function NewTask() {
  const { token } = useAuth();
  const router = useRouter();
  
  // State Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // State Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState(''); // Untuk bikin kategori on-the-fly

  useEffect(() => {
    if (token) fetchCategories();
  }, [token]);

  const fetchCategories = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCategories(await res.json());
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ name: newCategoryName }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories([...categories, cat]);
      setCategoryId(cat.id); // Otomatis pilih kategori baru
      setNewCategoryName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let fileUrl = null;

      // 1. Upload File dulu (jika ada)
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          fileUrl = data.imagePath;
        }
      }

      // 2. Create Task
      const taskPayload = {
        title,
        description,
        priority,
        dueDate, // Format YYYY-MM-DD dari input type="date" sudah sesuai
        categoryId: categoryId || null,
        isPublic,
        fileUrl,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskPayload),
      });

      if (!res.ok) throw new Error('Failed to create task');
      router.push('/'); // Kembali ke dashboard
    } catch (error) {
      alert('Error creating task');
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mt-4" style={{ maxWidth: '600px' }}>
        <h2>Create New Task</h2>
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
          
          {/* Title */}
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input type="text" className="form-control" required 
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3}
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="row">
            {/* Priority */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Priority</label>
              <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-control" required
                value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Category Section */}
          <div className="mb-3">
            <label className="form-label">Category</label>
            <div className="d-flex gap-2">
              <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">-- Select Category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {/* Quick Add Category */}
              <input type="text" className="form-control" placeholder="New Cat..." style={{width: '120px'}}
                value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              <button type="button" className="btn btn-secondary" onClick={handleCreateCategory}>+</button>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-3">
            <label className="form-label">Attachment (Image)</label>
            <input type="file" className="form-control" 
              onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
          </div>

          {/* Is Public Switch */}
          <div className="form-check form-switch mb-4">
            <input className="form-check-input" type="checkbox" 
              checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            <label className="form-check-label">Public Task (Visible to others)</label>
          </div>

          <button type="submit" className="btn btn-primary w-100">Create Task</button>
        </form>
      </div>
    </ProtectedRoute>
  );
}