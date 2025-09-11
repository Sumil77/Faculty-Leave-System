import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserFormModal({
  show,
  onClose,
  onSubmit,
  initialData = null,
}) {
  const [user_id, setFacultyId] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState({});

  const departments = ["CSE", "ECE", "ME", "CE"];
  const roles = ["Faculty", "Staff", "Admin"];

  // Pre-fill form if editing
  useEffect(() => {
    if (initialData) {
      setFacultyId(initialData.user_Id || "");
      setName(initialData.name || "");
      setDepartment(initialData.dept || "");
      setRole(initialData.role || "");
    } else {
      setFacultyId("");
      setName("");
      setDepartment("");
      setRole("");
    }
    setErrors({});
  }, [initialData, show]);

  const validate = () => {
    const newErrors = {};
    if (!user_id) newErrors.user_id = "Faculty ID is required";
    if (!name) newErrors.name = "Name is required";
    if (!department) newErrors.department = "Please select a department";
    if (!role) newErrors.role = "Please select a role";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ user_id, name, dept, role });
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {initialData ? "Edit User" : "Add User"}
            </h2>

            <form className="space-y-4">
              {/* Faculty ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty ID
                </label>
                <input
                  type="text"
                  value={user_id}
                  onChange={(e) => setFacultyId(e.target.value)}
                  disabled={!!initialData} // lock if editing
                  className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.user_id ? "border-red-500" : "border-gray-300"
                    } disabled:bg-gray-100`}
                />
                {errors.user_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.user_id}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.department ? "border-red-500" : "border-gray-300"
                    }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.role ? "border-red-500" : "border-gray-300"
                    }`}
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <button
                    type="button"
                    onClick={handleSubmit}
                  ></button>
                  {initialData ? "Save Changes" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}