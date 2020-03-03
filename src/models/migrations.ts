export type Migration = () => void | Promise<void>;

export interface Migrations {
  [key: string]: Migration;
}
