import { http, HttpResponse } from "msw";

let mockUsers = [
  {
    user_id: 101,
    name: "Anjali Sharma",
    email: "anjali@example.com",
    desig: "Professor",
    dept: "CSE",
    phno: "9876543210",
    dateOfJoining: "2018-01-10",
  },
  {
    user_id: 102,
    name: "Ravi Kumar",
    email: "ravi@example.com",
    desig: "Assistant Professor",
    dept: "ECE",
    phno: "9876543211",
    dateOfJoining: "2019-03-15",
  },
  {
    user_id: 103,
    name: "Priya Singh",
    email: "priya@example.com",
    desig: "Professor",
    dept: "ME",
    phno: "9876543212",
    dateOfJoining: "2020-06-20",
  },
  {
    user_id: 104,
    name: "Sanjay Das",
    email: "sanjay@example.com",
    desig: "Lecturer",
    dept: "CSE",
    phno: "9876543213",
    dateOfJoining: "2021-02-05",
  },
  {
    user_id: 105,
    name: "Neha Verma",
    email: "neha@example.com",
    desig: "Assistant Professor",
    dept: "EEE",
    phno: "9876543214",
    dateOfJoining: "2022-07-01",
  },
  {
    user_id: 106,
    name: "Amit Jain",
    email: "amit@example.com",
    desig: "Professor",
    dept: "CSE",
    phno: "9876543215",
    dateOfJoining: "2017-11-12",
  },
  {
    user_id: 107,
    name: "Sakshi Gupta",
    email: "sakshi@example.com",
    desig: "Lecturer",
    dept: "ECE",
    phno: "9876543216",
    dateOfJoining: "2020-01-20",
  },
  {
    user_id: 108,
    name: "Vikram Patel",
    email: "vikram@example.com",
    desig: "Assistant Professor",
    dept: "ME",
    phno: "9876543217",
    dateOfJoining: "2019-09-10",
  },
  {
    user_id: 109,
    name: "Ritu Kapoor",
    email: "ritu@example.com",
    desig: "Professor",
    dept: "EEE",
    phno: "9876543218",
    dateOfJoining: "2018-05-15",
  },
  {
    user_id: 110,
    name: "Deepak Rao",
    email: "deepak@example.com",
    desig: "Lecturer",
    dept: "CSE",
    phno: "9876543219",
    dateOfJoining: "2021-12-01",
  },
];

let mockCredentials = mockUsers.map((u) => ({
  user_id: u.user_id,
  email: u.email,
  password: "pass123",
  role: "faculty",
  status: "active",
}));

let mockLeaveBalance = {};
mockUsers.forEach((u) => {
  mockLeaveBalance[u.user_id] = {
    user_id: u.user_id,
    dateOfJoining: u.dateOfJoining,
    casual: 5,
    medical: 10,
    specialCasual: 2,
    extraOrdinary: 0,
    earned: 12,
    onDutyExam: 1,
    onDutyOther: 0,
    maternity: 0,
    election: 0,
    compensatory: 3,
    withoutPay: 0,
  };
});

let mockPending = [
  {
    id: 201,
    user_id: 101,
    name: "Anjali Sharma",
    dept: "CSE",
    from: "2025-09-10",
    to: "2025-09-11",
    applied: "2025-09-01 09:30 AM",
    reason: "Casual leave",
    leaveType: "casual",
    appliedOn: "2025-09-01T09:30:00Z",
    status: "Pending",
  },
  {
    id: 202,
    user_id: 102,
    name: "Ravi Kumar",
    dept: "ECE",
    from: "2025-09-12",
    to: "2025-09-14",
    applied: "2025-09-02 11:00 AM",
    reason: "Medical leave",
    leaveType: "medical",
    appliedOn: "2025-09-02T11:00:00Z",
    status: "Pending",
  },
  {
    id: 203,
    user_id: 104,
    name: "Sanjay Das",
    dept: "CSE",
    from: "2025-09-15",
    to: "2025-09-17",
    applied: "2025-09-05 02:15 PM",
    reason: "Earned leave",
    leaveType: "earned",
    appliedOn: "2025-09-05T14:15:00Z",
    status: "Pending",
  },
  {
    id: 204,
    user_id: 105,
    name: "Neha Verma",
    dept: "EEE",
    from: "2025-09-18",
    to: "2025-09-19",
    applied: "2025-09-06 10:30 AM",
    reason: "Casual leave",
    leaveType: "casual",
    appliedOn: "2025-09-06T10:30:00Z",
    status: "Pending",
  },
  {
    id: 205,
    user_id: 106,
    name: "Amit Jain",
    dept: "CSE",
    from: "2025-09-20",
    to: "2025-09-22",
    applied: "2025-09-07 01:00 PM",
    reason: "Medical leave",
    leaveType: "medical",
    appliedOn: "2025-09-07T13:00:00Z",
    status: "Pending",
  },
];

let mockApproved = [
  {
    id: 301,
    user_id: 101,
    name: "Anjali Sharma",
    dept: "CSE",
    from: "2025-08-01",
    to: "2025-08-03",
    applied: "2025-07-25 02:15 PM",
    reason: "Earned leave",
    leaveType: "earned",
    appliedOn: "2025-07-25T14:15:00Z",
    status: "Approved",
  },
  {
    id: 302,
    user_id: 103,
    name: "Priya Singh",
    dept: "ME",
    from: "2025-08-10",
    to: "2025-08-11",
    applied: "2025-08-05 08:45 AM",
    reason: "Casual leave",
    leaveType: "casual",
    appliedOn: "2025-08-05T08:45:00Z",
    status: "Approved",
  },
  {
    id: 303,
    user_id: 106,
    name: "Amit Jain",
    dept: "CSE",
    from: "2025-07-12",
    to: "2025-07-14",
    applied: "2025-07-05 11:30 AM",
    reason: "Medical leave",
    leaveType: "medical",
    appliedOn: "2025-07-05T11:30:00Z",
    status: "Approved",
  },
  {
    id: 304,
    user_id: 108,
    name: "Vikram Patel",
    dept: "ME",
    from: "2025-06-20",
    to: "2025-06-22",
    applied: "2025-06-15 10:00 AM",
    reason: "Earned leave",
    leaveType: "earned",
    appliedOn: "2025-06-15T10:00:00Z",
    status: "Approved",
  },
];

let mockRejected = [
  {
    id: 401,
    user_id: 102,
    name: "Ravi Kumar",
    dept: "ECE",
    from: "2025-07-05",
    to: "2025-07-06",
    applied: "2025-07-01 10:00 AM",
    reason: "Special casual",
    leaveType: "specialCasual",
    appliedOn: "2025-07-01T10:00:00Z",
    status: "Rejected",
  },
  {
    id: 402,
    user_id: 105,
    name: "Neha Verma",
    dept: "EEE",
    from: "2025-06-15",
    to: "2025-06-16",
    applied: "2025-06-10 01:30 PM",
    reason: "On duty exam",
    leaveType: "onDutyExam",
    appliedOn: "2025-06-10T13:30:00Z",
    status: "Rejected",
  },
  {
    id: 403,
    user_id: 110,
    name: "Deepak Rao",
    dept: "CSE",
    from: "2025-08-15",
    to: "2025-08-16",
    applied: "2025-08-10 11:00 AM",
    reason: "Medical leave",
    leaveType: "medical",
    appliedOn: "2025-08-10T11:00:00Z",
    status: "Rejected",
  },
];

let sessionUser = null;

if (import.meta.env.MODE === "development") {
  sessionUser = {
    user_id: 101,
    name: "Anjali Sharma",
    email: "anjali@example.com",
    desig: "Professor",
    dept: "CSE",
    phno: "9876543210",
    dateOfJoining: "2018-01-10",
  };
}

export const handlers = [
  http.get("/api/session", () => {
    if (import.meta.env.MODE === "development") {
      return HttpResponse.json({ user: sessionUser });
    }
    if (!sessionUser) {
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    return HttpResponse.json({ user: sessionUser });
  }),

  http.post("/api/session", async ({ request }) => {
    const { email, password } = await request.json();
    console.log({ email, password });

    const cred = mockCredentials.find(
      (c) => c.email === email && c.password === password
    );
    if (!cred)
      return HttpResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );

    sessionUser = mockUsers.find((u) => u.user_id === cred.user_id);
    return HttpResponse.json(sessionUser);
  }),

  http.delete("/api/session", () => {
    sessionUser = null;
    return HttpResponse.json({ message: "Logged out" });
  }),

  http.post("/api/users", async ({ request }) => {
    const newUser = await request.json();
    mockUsers.push(newUser);
    mockCredentials.push({
      user_id: newUser.user_id,
      email: newUser.email,
      password: newUser.password,
      role: "faculty",
      status: "active",
    });
    return HttpResponse.json(newUser, { status: 201 });
  }),

  http.get("/api/users/me", () => {
    if (import.meta.env.MODE === "development") {
      return HttpResponse.json({
        name: sessionUser.name,
        email: sessionUser.email,
        phno: sessionUser.phno,
        desig: sessionUser.desig,
        dept: sessionUser.dept,
        doj: sessionUser.dateOfJoining,
      });
    }
    if (!sessionUser)
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });
    return HttpResponse.json(sessionUser);
  }),

  http.get("/api/leave/recent", () => {
    if (!sessionUser) {
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(today.getMonth() - 1);

    const filterByDate = (leave) => {
      const from = new Date(leave.fromDate);
      return from >= monthAgo && from <= today;
    };

    const pending = mockPending.filter(filterByDate).map((l) => ({
      ...l,
      status: "Pending",
    }));

    const approved = mockApproved.filter(filterByDate).map((l) => ({
      ...l,
      status: "Approved",
    }));

    const recents = [...pending, ...approved].sort(
      (a, b) => new Date(b.appliedOn) - new Date(a.appliedOn)
    );

    return HttpResponse.json(recents);
  }),

  http.get("/api/leave/balance", () => {
    if (!sessionUser)
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });
  }),

  http.post("/api/leave/apply", async ({ request }) => {
    if (!sessionUser)
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });

    const leave = await request.json();

    const newLeave = {
      id: Date.now(),
      user_id: sessionUser.user_id,
      leaveType: leave.type,
      fromDate: leave.from,
      toDate: leave.to,
      appliedOn: new Date().toISOString(),
      status: "Pending",
    };

    mockPending.push(newLeave);

    return HttpResponse.json(newLeave, { status: 201 });
  }),

  http.get("/api/leave/getLeave", ({ request }) => {
    if (!sessionUser) {
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);

    let data = [];
    if (status === "Pending") data = mockPending;
    else if (status === "Approved") data = mockApproved;
    else if (status === "Rejected") data = mockRejected;
    else return HttpResponse.json({ error: "Invalid status" }, { status: 400 });

    const totalEntries = data.length;
    const totalPages = Math.ceil(totalEntries / limit);
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedData.map((l) => ({
        ...l,
        appliedOnIST: new Date(l.appliedOn || Date.now()).toLocaleString(
          "en-IN",
          {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }
        ),
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }),

  http.post("/api/leave/cancelPending", async ({ request }) => {
    const ids = await request.json();
    mockPending = mockPending.filter((l) => !ids.includes(l.id));
    return HttpResponse.json({ cancelled: ids, notCanceled: [] });
  }),

  http.get("/api/leave/taken/:userId", ({ params }) => {
    const { userId } = params;
    const allLeaves = [...mockPending, ...mockApproved, ...mockRejected];
    return HttpResponse.json(allLeaves.filter((l) => l.user_id == userId));
  }),

  http.patch("/api/leave/approve/:leaveId", async ({ params, request }) => {
    const { leaveId } = params;
    const { status } = await request.json();

    let leave = [...mockPending, ...mockApproved, ...mockRejected].find(
      (l) => l.id == leaveId
    );
    if (!leave) {
      return HttpResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    if (status === "Approved") {
      mockPending = mockPending.filter((l) => l.id != leaveId);
      leave.status = "Approved";
      mockApproved.push(leave);
    } else if (status === "Rejected") {
      mockPending = mockPending.filter((l) => l.id != leaveId);
      leave.status = "Rejected";
      mockRejected.push(leave);
    }

    return HttpResponse.json({ success: true, leaveId, status });
  }),
  // =================== ADMIN USERS ===================
  http.get("/api/admin/getUsers", ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("searchTerm")?.toLowerCase() || "";
    const deptFilter = url.searchParams.get("deptFilter") || "All";
    const roleFilter = url.searchParams.get("roleFilter") || "All";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    let filtered = [...mockUsers];

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm) ||
          u.email.toLowerCase().includes(searchTerm) ||
          u.user_id.toString().includes(searchTerm)
      );
    }

    if (deptFilter !== "All")
      filtered = filtered.filter((u) => u.dept === deptFilter);
    if (roleFilter !== "All")
      filtered = filtered.filter((u) => u.desig === roleFilter);

    const totalEntries = filtered.length;
    const totalPages = Math.max(Math.ceil(totalEntries / limit), 1);
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginated,
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }),

  http.post("/api/admin/postUser", async ({ request }) => {
    const newUser = await request.json();
    newUser.user_id = Date.now();
    mockUsers.push(newUser);
    mockCredentials.push({
      user_id: newUser.user_id,
      email: newUser.email,
      password: newUser.password || "pass123",
      role: "faculty",
      status: "active",
    });
    mockLeaveBalance[newUser.user_id] = {
      user_id: newUser.user_id,
      dateOfJoining: newUser.dateOfJoining,
      casual: 5,
      medical: 10,
      specialCasual: 2,
      extraOrdinary: 0,
      earned: 12,
      onDutyExam: 1,
      onDutyOther: 0,
      maternity: 0,
      election: 0,
      compensatory: 3,
      withoutPay: 0,
    };
    return HttpResponse.json(newUser, { status: 201 });
  }),

  http.patch("/api/admin/patchUser/:userId", async ({ params, request }) => {
    const { userId } = params;
    const updatedData = await request.json();
    const index = mockUsers.findIndex((u) => u.user_id == userId);
    if (index === -1)
      return HttpResponse.json({ error: "User not found" }, { status: 404 });
    mockUsers[index] = { ...mockUsers[index], ...updatedData };
    return HttpResponse.json(mockUsers[index]);
  }),

  http.delete("/api/admin/deleteUsers", async ({ request }) => {
    // request is a real Fetch Request object
    const ids = await request.json(); // parses JSON body into array
    console.log("received ids:", ids);

    mockUsers = mockUsers.filter((u) => !ids.includes(u.user_id));
    mockCredentials = mockCredentials.filter((c) => !ids.includes(c.user_id));
    Object.keys(mockLeaveBalance).forEach((uid) => {
      if (ids.includes(Number(uid))) delete mockLeaveBalance[uid];
    });
    mockPending = mockPending.filter((l) => !ids.includes(l.user_id));
    mockApproved = mockApproved.filter((l) => !ids.includes(l.user_id));
    mockRejected = mockRejected.filter((l) => !ids.includes(l.user_id));

    return HttpResponse.json({ success: true, deleted: ids });
  }),

  // =================== ADMIN REQUESTS ===================
  http.get("/api/admin/leaves", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "All";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);
    const sortKey = url.searchParams.get("sortKey") || "from";
    const sortDir = url.searchParams.get("sortDir") || "asc";
    const summary = url.searchParams.get("summary");

    if (summary) {
      // All leaves combined
      const allLeaves = [...mockPending, ...mockApproved, ...mockRejected];

      // Stats
      const totalLeaves = allLeaves.length;
      const pending = mockPending.length;
      const approved = mockApproved.length;
      const rejected = mockRejected.length;
      const approvedPercent = totalLeaves
        ? Math.round((approved / totalLeaves) * 100)
        : 0;

      // Group by department
      const deptReports = mockUsers.map((u) => {
        const deptLeaves = allLeaves.filter((l) => l.user_id === u.user_id);
        return {
          name: u.dept,
          leaves: deptLeaves.length,
          approved: deptLeaves.filter((l) => l.status === "Approved").length,
          rejected: deptLeaves.filter((l) => l.status === "Rejected").length,
          pending: deptLeaves.filter((l) => l.status === "Pending").length,
        };
      });

      // Merge same department entries
      const deptSummary = Object.values(
        deptReports.reduce((acc, curr) => {
          if (!acc[curr.name]) {
            acc[curr.name] = { ...curr };
          } else {
            acc[curr.name].leaves += curr.leaves;
            acc[curr.name].approved += curr.approved;
            acc[curr.name].rejected += curr.rejected;
            acc[curr.name].pending += curr.pending;
          }
          return acc;
        }, {})
      );

      // Find top dept by leaves
      const topDept =
        deptSummary.sort((a, b) => b.leaves - a.leaves)[0]?.name || "N/A";

      return HttpResponse.json({
        stats: { totalLeaves, pending, approvedPercent, topDept },
        deptReports: deptSummary,
      });
    }

    let data = [];
    if (status === "Pending") data = [...mockPending];
    else if (status === "Approved") data = [...mockApproved];
    else if (status === "Rejected") data = [...mockRejected];
    else if (status === "All")
      data = [...mockPending, ...mockApproved, ...mockRejected];

    // Sorting
    if (sortKey) {
      data.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    const totalEntries = data.length;
    const totalPages = Math.max(Math.ceil(totalEntries / limit), 1);
    const offset = (page - 1) * limit;
    const paginated = data.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginated,
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }),

  http.patch("/api/admin/leaves/:leaveId", async ({ params, request }) => {
    const { leaveId } = params;
    const { status } = await request.json();
    let leave = [...mockPending, ...mockApproved, ...mockRejected].find(
      (l) => l.id == leaveId
    );
    if (!leave)
      return HttpResponse.json({ error: "Leave not found" }, { status: 404 });
    if (status === "Approved") {
      mockPending = mockPending.filter((l) => l.id != leaveId);
      leave.status = "Approved";
      mockApproved.push(leave);
    } else if (status === "Rejected") {
      mockPending = mockPending.filter((l) => l.id != leaveId);
      leave.status = "Rejected";
      mockRejected.push(leave);
    }

    const response = { success: true, leaveId, status };
    console.log(response);

    return HttpResponse.json(response);
  }),

  http.post("/api/admin/leaves/cancel", async ({ request }) => {
    const ids = await request.json();
    const notFound = [];
    ids.forEach((id) => {
      const idx = mockPending.findIndex((l) => l.id === id);
      if (idx !== -1) mockPending.splice(idx, 1);
      else notFound.push(id);
    });

    const response = {
      cancelled: ids.filter((id) => !notFound.includes(id)),
      notCancelled: notFound,
    };

    console.log(response);

    return HttpResponse.json(response);
  }),

  // =================== ADMIN REPORTS ===================
  http.get("/api/admin/reports/leaves", ({ request }) => {
    const url = new URL(request.url);
    const dept = url.searchParams.get("department") || "All";
    const role = url.searchParams.get("role") || "All";
    const fromDate = url.searchParams.get("fromDate");
    const toDate = url.searchParams.get("toDate");

    let data = [...mockPending, ...mockApproved, ...mockRejected];
    if (dept !== "All")
      data = data.filter((l) => {
        const u = mockUsers.find((u) => u.user_id === l.user_id);
        return u?.dept === dept;
      });
    if (role !== "All")
      data = data.filter((l) => {
        const u = mockUsers.find((u) => u.user_id === l.user_id);
        return u?.desig === role;
      });
    if (fromDate)
      data = data.filter((l) => new Date(l.fromDate) >= new Date(fromDate));
    if (toDate)
      data = data.filter((l) => new Date(l.toDate) <= new Date(toDate));

    console.log({ data });

    return HttpResponse.json({ data });
  }),

  http.get("/api/admin/reports/summary", () => {
    const response = {
      totalUsers: mockUsers.length,
      totalPending: mockPending.length,
      totalApproved: mockApproved.length,
      totalRejected: mockRejected.length,
    };

    console.log(response);

    return HttpResponse.json(response);
  }),

  // --- Admin Reports ---
  http.get("/api/admin/reports", ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("searchTerm")?.toLowerCase() || "";
    const dept = url.searchParams.get("dept") || "";
    const status = url.searchParams.get("status") || "";
    const type = url.searchParams.get("type") || "";
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 5;
    const startDate = url.searchParams.get("startDate") || "";
    const endDate = url.searchParams.get("endDate") || "";

    // Combine all leaves
    let allLeaves = [...mockPending, ...mockApproved, ...mockRejected].map(
      (l) => {
        const user = mockUsers.find((u) => u.user_id === l.user_id);
        return {
          id: l.id,
          faculty: user?.name || "Unknown",
          dept: user?.dept || "Unknown",
          type: l.leaveType,
          status: l.status,
          appliedOn: l.appliedOn.split("T")[0],
          fromDate: l.fromDate,
          toDate: l.toDate,
        };
      }
    );

    // Filtering
    if (searchTerm) {
      allLeaves = allLeaves.filter((l) =>
        l.faculty.toLowerCase().includes(searchTerm)
      );
    }
    if (dept) allLeaves = allLeaves.filter((l) => l.dept === dept);
    if (status) allLeaves = allLeaves.filter((l) => l.status === status);
    if (type) allLeaves = allLeaves.filter((l) => l.type === type);
    if (startDate) allLeaves = allLeaves.filter((l) => l.fromDate >= startDate);
    if (endDate) allLeaves = allLeaves.filter((l) => l.toDate <= endDate);

    // Pagination
    const totalPages = Math.ceil(allLeaves.length / limit);
    const paged = allLeaves.slice((page - 1) * limit, page * limit);

    return HttpResponse.json({
      leaves: paged,
      totalPages,
    });
  }),

  http.get("/api/admin/downloadReport", () => {
    const blob = new Blob(["id,name,leaves\n1,CSE,45"], {
      type: "text/csv",
    });
    return HttpResponse.blob(blob, {
      headers: { "Content-Disposition": "attachment; filename=report.csv" },
    });
  }),

  http.post("/api/admin/mailReport", async ({ request }) => {
    const body = await request.json();
    console.log("📧 Mock mailReport request:", body);

    return HttpResponse.json({ success: true, message: "Report mailed!" });
  }),
];
