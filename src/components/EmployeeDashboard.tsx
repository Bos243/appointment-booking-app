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

// Define AppointmentStatus type if not already imported
type AppointmentStatus = "pending" | "confirmed" | "completed" | "canceled";

export default function EmployeeDashboard({ uid }: { uid: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const q = query(collection(db, "appointments"), where("employeeId", "==", uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
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
          };
        });
        setAppointments(apps);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateDoc(doc(db, "appointments", id), {
        status: newStatus,
      });
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  return (
    <div>
      <h2>Employee Dashboard - Assigned Appointments</h2>
      {appointments.length === 0 && <p>No appointments assigned to you yet.</p>}
      <ul>
        {appointments.map((app: Appointment) => (
          <li key={app.id} style={{ marginBottom: 16, border: "1px solid #ccc", padding: 12 }}>
            <strong>Service:</strong> {app.serviceType} <br />
            <strong>Date & Time:</strong> {app.datetime.toLocaleString()} <br />
            <strong>Status:</strong> {app.status} <br />
            {app.notes && (
              <>
                <strong>Notes:</strong> {app.notes} <br />
              </>
            )}
            <div style={{ marginTop: 8 }}>
              {app.status === "pending" && (
                <>
                  <button onClick={() => updateStatus(app.id, "confirmed")} style={{ marginRight: 8 }}>
                    Confirm
                  </button>
                  <button onClick={() => updateStatus(app.id, "canceled")} style={{ marginRight: 8 }}>
                    Cancel
                  </button>
                </>
              )}
              {app.status === "confirmed" && (
                <>
                  <button onClick={() => updateStatus(app.id, "completed")} style={{ marginRight: 8 }}>
                    Mark Completed
                  </button>
                  <button onClick={() => updateStatus(app.id, "canceled")} style={{ marginRight: 8 }}>
                    Cancel
                  </button>
                </>
              )}
              {(app.status === "completed" || app.status === "canceled") && <em>No further actions available.</em>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}