// UserDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  query,
  collection,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  deleteDoc,
  doc,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Appointment, availableSlots, services } from "./types";

export default function UserDashboard({ uid }: { uid: string }) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(availableSlots[0]);
  const [serviceType, setServiceType] = useState<string>(services[0]);
  const [notes, setNotes] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const q = query(collection(db, "appointments"), where("userId", "==", uid));
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);

  try {
    console.log("Submitting appointment with UID:", uid); // ✅ Debug log

    const [hour, minutePart] = time.split(":");
    const minute = minutePart.slice(0, 2);
    const ampm = minutePart.slice(3);
    let hour24 = parseInt(hour);
    if (ampm === "PM" && hour24 !== 12) hour24 += 12;
    if (ampm === "AM" && hour24 === 12) hour24 = 0;

    const dt = new Date(date);
    dt.setHours(hour24, parseInt(minute), 0, 0);

    await addDoc(collection(db, "appointments"), {
      userId: uid,
      employeeId: "",               // required for Firestore schema
      employeeDone: false,          // default value
      datetime: Timestamp.fromDate(dt),
      status: "pending",
      serviceType,
      notes: notes || "",           // optional but ensure it's a string
    });

    alert("✅ Appointment requested!");
    setNotes("");
  } catch (err: any) {
    alert("Error booking appointment: " + err.message);
  } finally {
    setLoading(false);
  }
};


  const cancelAppointment = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    await deleteDoc(doc(db, "appointments", id));
  };

  return (
    <div>
      <h2>User Dashboard - Book Appointment</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <label>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
            required
            min={new Date().toISOString().slice(0, 10)}
          />
        </label>
        <br />
        <label>
          Time:
          <select value={time} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTime(e.target.value)}>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Service:
          <select value={serviceType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setServiceType(e.target.value)}>
            {services.map((srv) => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Notes (optional):
          <textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} />
        </label>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Booking..." : "Request Appointment"}
        </button>
      </form>

      <h3>My Appointments</h3>
      {appointments.length === 0 && <p>No appointments booked yet.</p>}
      <ul>
        {appointments.map((app: Appointment) => (
          <li key={app.id} style={{ marginBottom: 8 }}>
            <strong>{app.serviceType}</strong> on{" "}
            {app.datetime.toLocaleString()} - Status: {app.status}
            <br />
            {app.notes && <em>Notes: {app.notes}</em>}
            <br />
            {(app.status === "pending" || app.status === "confirmed") && (
              <button onClick={() => cancelAppointment(app.id)}>Cancel</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
