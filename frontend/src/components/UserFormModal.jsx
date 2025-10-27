import { useState, useEffect } from "react";

export default function UserFormModal({ show, onClose, onSubmit, initialData = {}, departments: deptOptions = [], roles: roleOptions = [] }) {
  const [user_id, setUserId] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [desig, setDesig] = useState("");
  const [phno, setPhno] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  // Fill form if editing
  useEffect(() => {
    if (initialData) {
      setUserId(initialData.user_id || "");
      setName(initialData.name || "");
      setDept(initialData.dept || "");
      setDesig(initialData.desig || "");
      setPhno(initialData.phno || "");
      setDateOfJoining(initialData.dateOfJoining || "");
      setEmail(initialData.email || "");
    } else {
      setUserId("");
      setName("");
      setDept("");
      setDesig("");
      setPhno("");
      setDateOfJoining("");
      setEmail("");
    }
    setErrors({});
  }, [initialData, show]);

  const validate = () => {
    const newErrors = {};
    if (!user_id) newErrors.user_id = "Faculty ID is required";
    if (!name) newErrors.name = "Name is required";
    if (!dept) newErrors.dept = "Department is required";
    if (!desig) newErrors.desig = "Role/Designation is required";
    if (!phno) newErrors.phno = "Phone number is required";
    if (!dateOfJoining) newErrors.dateOfJoining = "Joining date is required";
    if (!email) newErrors.email = "Email is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Construct payload according to backend
    onSubmit({ user_id, name, dept, desig, phno, dateOfJoining, email });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{initialData ? "Edit User" : "Add User"}</h2>

        <form className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Faculty ID</label>
            <input
              type="text"
              value={user_id}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!!initialData}
              className={`w-full border px-3 py-2 rounded ${errors.user_id ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.user_id && <p className="text-red-500 text-sm">{errors.user_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${errors.name ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${errors.dept ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select Department</option>
              {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.dept && <p className="text-red-500 text-sm">{errors.dept}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Role/Designation</label>
            <select
              value={desig}
              onChange={(e) => setDesig(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${errors.desig ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select Role</option>
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.desig && <p className="text-red-500 text-sm">{errors.desig}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="text"
              value={phno}
              onChange={(e) => setPhno(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${errors.phno ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.phno && <p className="text-red-500 text-sm">{errors.phno}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Date of Joining</label>
            <input
              type="date"
              value={dateOfJoining}
              onChange={(e) => setDateOfJoining(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${errors.dateOfJoining ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.dateOfJoining && <p className="text-red-500 text-sm">{errors.dateOfJoining}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${errors.email ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
              {initialData ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
