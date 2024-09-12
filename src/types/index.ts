export type TableType = 'square' | 'diamond' | 'round';

export interface Room {
  id: number;
  name: string;
  walls: [number, number, number, number][];
  tables: { x: number; y: number; type: TableType; chairs: boolean[] }[];
  subRooms: Room[];
  isTemporary: boolean;
}

export type Tool = 'wall' | 'table' | 'room' | null;
export type WallSubTool = 'add' | 'delete' | null;
export type TableSubTool = 'add' |  'delete' | 'move' | 'merge' | 'editChairs' | null;
export type RoomSubTool = 'add' | 'edit' |  'delete' | null;