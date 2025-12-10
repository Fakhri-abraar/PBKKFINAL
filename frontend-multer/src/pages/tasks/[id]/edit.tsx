import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { Category, Task } from "../../../types";

export default function EditTask() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !id) return;

    // 1. Fetch Categories untuk dropdown
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.json())
    .then((data) => setCategories(data));

    // 2. Fetch Task Detail
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Task not found");
        const data: Task = await res.json();
        
        // Isi form dengan data yang ada
        setTitle(data.title);
        setDescription(data.description || "");
        setPriority(data.priority);
        setCategoryId(data.categoryId || "");
        setIsPublic(data.isPublic);
        
        // Format tanggal agar sesuai input type="date" (YYYY-MM-DD)
        if (data.dueDate) {
          const dateObj = new Date(data.dueDate);
          const dateStr = dateObj.toISOString().split('T')[0];
          setDueDate(dateStr);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load task");
        router.push("/");
      });
  }, [id, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: new Date(dueDate).toISOString(),
          categoryId: categoryId || null,
          isPublic,
        }),
      });

      if (res.ok) {
        alert("Task updated successfully");
        router.push("/");
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update task");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;

  return (
    <ProtectedRoute>
      <div className="container mt-4">
        <div className="card p-4 mx-auto" style={{ maxWidth: "600px" }}>
          <h2 className="mb-4">Edit Task</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="isPublic">
                Make Public (Visible to everyone)
              </label>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary flex-grow-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <Link href="/" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}