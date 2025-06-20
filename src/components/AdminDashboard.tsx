// AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  query,
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
  where, // <-- Add this import
} from "firebase/firestore";
import { db } from "./firebase";
import { Appointment, User } from "./types";

// Define AppointmentStatus type if not already imported
type AppointmentStatus = "pending" | "confirmed" | "completed" | "canceled";

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");

  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        let apps: Appointment[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            employeeId: data.employeeId,
            datetime: data.datetime.toDate(),
            status: data.status,
            serviceType: data.serviceType,
            notes: data.notes,
          };
        });

        if (filterStatus !== "all") {
          apps = apps.filter((app) => app.status === filterStatus);
        }
        if (filterEmployee !== "all") {
          apps = apps.filter((app) => app.employeeId === filterEmployee);
        }

        setAppointments(apps);
      }
    );
    return () => unsubscribe();
  }, [filterStatus, filterEmployee]);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        // Only fetch users with role "Employee"
        const q = query(collection(db, "users"), where("role", "==", "Employee"));
        const snapshot = await getDocs(q);
        const allUsers: User[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email,
            role: data.role,
          };
        });

        setUsers(allUsers);
        setEmployees(allUsers);
      } catch (err) {
        alert("Failed to fetch users: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status: newStatus });
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const assignEmployee = async (appointmentId: string, employeeId: string) => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), { employeeId });
    } catch (err: any) {
      alert("Failed to assign employee: " + err.message);
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <section style={{ marginBottom: 24 }}>
        <h3>Filters</h3>
        <label>
          Status:
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </label>
        <label style={{ marginLeft: 12 }}>
          Employee:
          <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
            <option value="all">All</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.email}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>Appointments ({appointments.length})</h3>
        {appointments.length === 0 && <p>No appointments found.</p>}
        <div style={{ marginBottom: 16 }}>
          <label>
            Status:
            <select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label style={{ marginLeft: 12 }}>
            Employee:
            <select
              value={filterEmployee}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterEmployee(e.target.value)}
            >
              <option value="all">All</option>
              {employees.map((emp: User) => (
                <option key={emp.id} value={emp.id}>
                  {emp.email}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul>
          {appointments.map((app: Appointment) => (
            <li
              key={app.id}
              style={{ marginBottom: 16, border: "1px solid #ccc", padding: 12, borderRadius: 4 }}
            >
              <strong>Service:</strong> {app.serviceType} <br />
              <strong>Date & Time:</strong> {app.datetime.toLocaleString()} <br />
              <strong>Status:</strong> {app.status} <br />
              <strong>User:</strong> {users.find((u: User) => u.id === app.userId)?.email || app.userId} <br />
              <strong>Assigned Employee:</strong>{" "}
              <select
                value={app.employeeId || ""}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => assignEmployee(app.id, e.target.value)}
              >
                <option value="">Unassigned</option>
                {employees.map((emp: User) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.email}
                  </option>
                ))}
              </select>
              <br />
              {app.notes && (
                <>
                  <strong>Notes:</strong> {app.notes} <br />
                </>
              )}
              <div style={{ marginTop: 8 }}>
                {app.status !== "completed" && app.status !== "canceled" && (
                  <>
                    {app.status !== "confirmed" && (
                      <button
                        onClick={() => updateStatus(app.id, "confirmed")}
                        style={{ marginRight: 8 }}
                      >
                        Confirm
                      </button>
                    )}
                    {(app.status === "pending" || app.status === "confirmed") && (
                      <button
                        onClick={() => updateStatus(app.id, "canceled")}
                        style={{ marginRight: 8 }}
                      >
                        Cancel
                      </button>
                    )}
                    {app.status === "confirmed" && (
                      <button onClick={() => updateStatus(app.id, "completed")}>Mark Completed</button>
                    )}
                  </>
                )}
                {(app.status === "completed" || app.status === "canceled") && (
                  <em>No further actions available.</em>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}