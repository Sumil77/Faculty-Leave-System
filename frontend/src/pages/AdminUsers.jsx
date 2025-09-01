import { useState } from "react";
import { FiEdit, FiTrash2, FiUserPlus } from "react-icons/fi";

function AddUserModal({ show, onClose, onAdd }) {
  const [facultyId, setFacultyId] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!facultyId || !name || !department || !role) {
      alert("Please fill all fields");
      return;
    }
    onAdd({ facultyId, name, department, role });
    setFacultyId("");
    setName("");
    setDepartment("");
    setRole("");
    onClose();
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Faculty ID"
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([
    { id: 1, facultyId: "F101", name: "John Doe", department: "CSE", role: "Faculty" },
    { id: 2, facultyId: "F102", name: "Jane Smith", department: "ECE", role: "Staff" },
  ]);
  const [showAddUser, setShowAddUser] = useState(false);

  const handleAddUser = (newUser) => {
    // Assign a unique id (e.g. increment max id)
    const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    setUsers([...users, { id, ...newUser }]);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Manage Users</h1>
      <div className="mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2"
          onClick={() => setShowAddUser(true)}
        >
          <FiUserPlus /> <span>Add User</span>
        </button>
      </div>
      <AddUserModal show={showAddUser} onClose={() => setShowAddUser(false)} onAdd={handleAddUser} />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow">
          <thead className="bg-gray-200">
            <tr>
              {["Faculty ID", "Name", "Department", "Role", "Actions"].map((h, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3">{user.facultyId}</td>
                <td className="px-6 py-3">{user.name}</td>
                <td className="px-6 py-3">{user.department}</td>
                <td className="px-6 py-3">{user.role}</td>
                <td className="px-6 py-3 space-x-2 flex">
                  <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 flex items-center space-x-1">
                    <FiEdit /> <span>Edit</span>
                  </button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center space-x-1">
                    <FiTrash2 /> <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
