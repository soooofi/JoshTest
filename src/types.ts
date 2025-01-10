export interface Employee {
  id: string;
  name: string;
  email: string;
  count: number;
  remainingScans: number;
  user_id?: string;
}