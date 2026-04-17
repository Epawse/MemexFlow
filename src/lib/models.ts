import type { Database } from "./database.types";

type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Project = TableRow<"projects">;
export type Capture = TableRow<"captures">;
export type Memory = TableRow<"memories">;
export type Brief = TableRow<"briefs">;
export type Signal = TableRow<"signals">;
export type Job = TableRow<"jobs">;
