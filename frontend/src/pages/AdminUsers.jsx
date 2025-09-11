import { useState, useEffect, useMemo } from "react";
import {
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import UserFormModal from "../components/UserFormModal";
import ConfirmModal from "../components/ConfirmUserModal";
import Toast from "../components/Toast";
import * as adminController from "../util/admin.js";

/*the attributes dont match with the fetched data
Also the Department list needs to be defined statically
finding the list of dept from the fetched rows is not feasible 
as it is being handled now
*/

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterRole, setFilterRole] = useState("All");

  // Sorting
  const [sortField, setSortField] = useState("user_id");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Fetch users from API
  const loadUsers = async () => {
    try {
      const filters = {
        searchTerm: search,
        deptFilter: filterDept === "All" ? "" : filterDept,
        roleFilter: filterRole === "All" ? "" : filterRole,
        page,
        limit: perPage,
      };
      const { data = [], pagination = {} } = await adminController.getUsers(filters);
      setUsers(data);
      setTotalPages(pagination.totalPages || 1);

    } catch (err) {
      console.error(err);
      showToast("Failed to fetch users", "error");
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, filterDept, filterRole, page]);

  // Add User
  const handleAddUser = async (newUser) => {
    try {
      await adminController.postUser(newUser);
      showToast("User added successfully");
      loadUsers();
    } catch (err) {
      console.error(err);
      showToast("Failed to add user", "error");
    }
  };

  // Edit User
  const handleEditUser = async (updatedUser) => {
    try {
      await adminController.patchUser(updatedUser);
      showToast("User updated successfully");
      loadUsers();
    } catch (err) {
      console.error(err);
      showToast("Failed to update user", "error");
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    try {
      await adminController.deleteUsers([user.user_id]);
      setSelectedIds((prev) => prev.filter((x) => x !== user.user_id));
      showToast("User deleted successfully", "error");
      loadUsers();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete user", "error");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    try {
      console.log(selectedIds);
      
      await adminController.deleteUsers(selectedIds.map(Number));
      setSelectedIds([]);
      showToast("Selected users deleted", "error");
      loadUsers();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete selected users", "error");
    }
  };


  // Toggle Selection
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Sorting toggle
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Apply local sorting & filtering (for current page only)
  const pageData = useMemo(() => {
    let data = [...users];
    data.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [users, sortField, sortOrder]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
          <p className="text-gray-500 text-sm">Add, edit, and manage users</p>
        </div>
        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 flex items-center space-x-2 shadow-md"
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
        >
          <FiUserPlus /> <span>Add User</span>
        </button>
      </div>

      {/* Search + Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center border rounded-xl px-3 py-2 bg-white shadow-sm">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by Name or Faculty ID"
            className="outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-xl px-3 py-2 bg-white shadow-sm"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="All">All Departments</option>
          {adminController.dept.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="border rounded-xl px-3 py-2 bg-white shadow-sm"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="Faculty">Faculty</option>
          <option value="Staff">Staff</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl mb-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.length} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 shadow-sm"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* User Form Modal */}
      <UserFormModal
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) =>
          editingUser ? handleEditUser(data) : handleAddUser(data)
        }
        initialData={editingUser}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={() => handleDeleteUser(deleteUser)}
        title="Delete User"
        message={
          deleteUser
            ? `Are you sure you want to delete ${deleteUser.name} (${deleteUser.user_id})?`
            : ""
        }
      />

      {/* Users Table */}
      <div className="w-full rounded-xl shadow-md">
        <table className="w-full table-fixed bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="w-10 px-2 py-3 text-center">
                <input
                  type="checkbox"
                  checked={pageData.every((u) => selectedIds.includes(u.user_id))}
                  onChange={(e) =>
                    e.target.checked
                      ? setSelectedIds([
                        ...new Set([...selectedIds, ...pageData.map((u) => u.user_id)]),
                      ])
                      : setSelectedIds(
                        selectedIds.filter(
                          (user_id) => !pageData.map((u) => u.user_id).includes(user_id)
                        )
                      )
                  }
                />
              </th>
              <th
                className="w-[100px] px-2 py-3 text-left text-gray-700 font-semibold cursor-pointer select-none"
                onClick={() => toggleSort("facultyId")}
              >
                Faculty ID {sortField === "facultyId" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="w-[150px] px-2 py-3 text-left text-gray-700 font-semibold cursor-pointer select-none"
                onClick={() => toggleSort("name")}
              >
                Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="w-[160px] px-2 py-3 text-left text-gray-700 font-semibold cursor-pointer select-none"
                onClick={() => toggleSort("department")}
              >
                Department {sortField === "department" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="w-[120px] px-2 py-3 text-left text-gray-700 font-semibold cursor-pointer select-none"
                onClick={() => toggleSort("role")}
              >
                Role {sortField === "role" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="w-[120px] px-2 py-3 text-left text-gray-700 font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.map((user, i) => (
              <tr
                key={user.user_id}
                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}
              >
                {/* Checkbox */}
                <td className="w-10 px-2 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.user_id)}
                    onChange={() => toggleSelect(user.user_id)}
                  />
                </td>

                {/* Cells */}
                <td className="px-2 py-3 text-sm font-medium text-gray-800 truncate">{user.user_id}</td>
                <td className="px-2 py-3 text-sm text-gray-700 truncate">{user.name}</td>
                <td className="px-2 py-3 text-sm text-gray-700 truncate">{user.dept}</td>
                <td className="px-2 py-3 text-sm text-gray-700 truncate">{user.desig}</td>

                {/* Actions */}
                <td className="px-2 py-3 text-sm flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded-lg hover:bg-yellow-600 flex items-center gap-1 shadow-sm"
                    onClick={() => {
                      setEditingUser(user);
                      setShowForm(true);
                    }}
                  >
                    <FiEdit />
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 flex items-center gap-1 shadow-sm"
                    onClick={() => setDeleteUser(user)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}

            {pageData.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            <FiChevronLeft />
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            <FiChevronRight />
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
