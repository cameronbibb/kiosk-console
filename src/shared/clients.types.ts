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
