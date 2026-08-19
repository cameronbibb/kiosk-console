export interface ClientRecord {
  id: string; //uuid
  initials: string;
  room: string | null;
  active: boolean;
  intakeAt: string | null;
  createdAt: string;
}

export interface ClientInput {
  initials: string;
  room: string | null;
  intakeAt: string | null;
}

export type EndReason = "released" | "returned" | "broken" | "lost";

export interface AssignmentRecord {
  id: string;
  clientId: string;
  deviceSerial: string;
  assignedAt: string;
  returnedAt: string | null;
  endReason: EndReason | null;
  notes: string | null;
  performedBy: string | null;
}
