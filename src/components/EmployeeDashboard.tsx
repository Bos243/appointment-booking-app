// EmployeeDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  query,
  collection,
  where,
  onSnapshot,
  updateDoc,
  doc,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Appointment } from "./types";

type AppointmentStatus = "pending" | "confirmed" | "completed" | "canceled";

export default function EmployeeDashboard({ uid }: { uid: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [newAppointmentAlert, setNewAppointmentAlert] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "appointments"), where("employeeId", "==", uid));
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const apps: Appointment[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          employeeId: data.employeeId,
          datetime: data.datetime.toDate(),
          status: data.status,
          serviceType: data.serviceType,
          notes: data.notes,
          employeeDone: data.employeeDone || false, // new field, default false
        };
      });

      // Filter out appointments marked done by employee
      const visibleApps = apps.filter((app) => !app.employeeDone);

      // Detect new appointments assigned (optional: logic for notification)
      if (visibleApps.length > appointments.length) {
        setNewAppointmentAlert(true);
      }

      setAppointments(visibleApps);
    });

    return () => unsubscribe();
  }, [uid, appointments.length]);

  const markAsDone = async (appointmentId: string, done: boolean) => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        employeeDone: done,
      });
      if (done) {
        setNewAppointmentAlert(false); // clear alert if marking done
      }
    } catch (err: any) {
      alert("Failed to update appointment status: " + err.message);
    }
  };

  return (
    <div>
      <h2>Employee Dashboard - Assigned Appointments</h2>

      {newAppointmentAlert && (
        <div style={{ backgroundColor: "#d4edda", padding: "10px", marginBottom: "15px", borderRadius: "5px", color: "#155724" }}>
          🎉 You have new appointments assigned to you!
        </div>
      )}

      {appointments.length === 0 && <p>No appointments assigned to you yet.</p>}

      <ul>
        {appointments.map((app) => (
          <li key={app.id} style={{ marginBottom: 16, border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
            <strong>Service:</strong> {app.serviceType} <br />
            <strong>Date & Time:</strong> {app.datetime.toLocaleString()} <br />
            <strong>Status:</strong> {app.status} <br />
            {app.notes && (
              <>
                <strong>Notes:</strong> {app.notes} <br />
              </>
            )}

            <label style={{ marginTop: 8, display: "block", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={app.employeeDone || false}
                onChange={(e) => markAsDone(app.id, e.target.checked)}
              />{" "}
              Mark appointment as done
            </label>

            <div style={{ marginTop: 8 }}>
              {/* You can optionally keep Confirm/Cancel buttons if you want employee to manage status */}
              {app.status === "pending" && (
                <>
                  <button onClick={() => markAsDone(app.id, false)} style={{ marginRight: 8 }}>
                    Mark Not Done
                  </button>
                  <button onClick={() => markAsDone(app.id, true)} style={{ marginRight: 8 }}>
                    Mark Done
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
