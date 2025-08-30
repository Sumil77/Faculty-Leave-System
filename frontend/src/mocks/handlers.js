// src/mocks/handlers.js
import { http, HttpResponse } from "msw";

// Fake in-memory DB
let mockUsers = [
  {
    user_id: 123,
    email: "sumil@example.com",
    name: "Sumil",
    desig: "Professor",
    dept: "CSE",
    phno: "9876543210",
    dateOfJoining: "2020-01-01",
  },
];

let mockCredentials = [
  {
    user_id: 123,
    email: "gg@gg.com",
    password: "pass123",
    role: "faculty",
    status: "active",
  },
];

let mockLeaveBalance = {
  123: {
    user_id: 123,
    dateOfJoining: "2020-01-01",
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
  },
};

let mockPending = [];
let mockApproved = [];
let mockRejected = [];

// Active session (null means logged out)
let sessionUser = null;

export const handlers = [
  // ============================
  // SESSION ROUTES
  // ============================
  http.get("/api/session", () => {
    if (!sessionUser)
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });
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

  // ============================
  // USER ROUTES
  // ============================
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
    if (!sessionUser)
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });
    return HttpResponse.json(sessionUser);
  }),

  // ============================
  // LEAVE ROUTES
  // ============================
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
    return HttpResponse.json([mockLeaveBalance[123]]); // return as array
  }),

  http.post("/api/leave/apply", async ({ request }) => {
    if (!sessionUser)
      return HttpResponse.json({ error: "Not logged in" }, { status: 401 });
    const leave = await request.json();
    const newLeave = {
      id: Date.now(),
      user_id: sessionUser.user_id,
      ...leave,
      status: "Pending",
    };
    mockPending.push(newLeave);
    return HttpResponse.json(newLeave, { status: 201 });
  }),

  http.get("/api/leave/getLeave", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    if (status === "Pending")
      return HttpResponse.json({
        data: mockPending,
        pagination: { total: mockPending.length },
      });
    if (status === "Approved")
      return HttpResponse.json({
        data: mockApproved,
        pagination: { total: mockApproved.length },
      });
    if (status === "Rejected")
      return HttpResponse.json({
        data: mockRejected,
        pagination: { total: mockRejected.length },
      });

    return HttpResponse.json({ error: "Invalid status" }, { status: 400 });
  }),

  http.post("/api/leave/cancelPending", async ({ request }) => {
    const ids = await request.json();
    mockPending = mockPending.filter((l) => !ids.includes(l.id));
    return HttpResponse.json({ cancelled: ids, notCanceled: [] });
  }),

  // ============================
  // NEW: EXTRA ROUTES
  // ============================

  // Get all leaves taken by a user
  http.get("/api/leave/taken/:userId", ({ params }) => {
    const { userId } = params;
    const allLeaves = [...mockPending, ...mockApproved, ...mockRejected];
    return HttpResponse.json(allLeaves.filter((l) => l.user_id == userId));
  }),

  // Admin approve/reject leave
  http.patch("/api/leave/approve/:leaveId", async ({ params, request }) => {
    const { leaveId } = params;
    const { status } = await request.json();

    let leave = [...mockPending, ...mockApproved, ...mockRejected].find(
      (l) => l.id == leaveId
    );
    if (!leave) {
      return HttpResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    // Move leave between buckets
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
];
