// types.ts
import { User as FirebaseUser } from "firebase/auth";

export type Role = "User" | "Employee" | "Admin";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "canceled";

export interface AppUser {
  uid: string;
  email: string | null;
  role: Role;
}

export interface Appointment {
  id: string;
  userId: string;
  employeeId?: string;
  datetime: Date;
  status: AppointmentStatus;
  serviceType: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  role: "user" | "employee" | "admin";
  firstName?: string;
}

export type UserRole = "user" | "employee" | "admin";

export interface Appointment {
  id: string;
  userId: string;
  employeeId?: string;
  datetime: Date;
  status: "pending" | "confirmed" | "completed" | "canceled";
  serviceType: string;
  notes?: string;
}


export const availableSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
];

export const services = [
  "ID Card Issuance",
  "Residence Certificate",
  "Business License",
  "Land Registration",
];
