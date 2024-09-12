import { Room, TableType, Tool } from '../types';

// 现绘制临时点的函数
export const drawTempPoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

 // 绘制grid的函数
 export const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, unit: number) => {
    ctx.strokeStyle = 'rgb(192, 192, 192)'; // 灰色
    ctx.lineWidth = 1;

    const gridSize = unit; // 网格大小

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // 绘制walls的函数
export  const drawWalls = (ctx: CanvasRenderingContext2D, walls: Room['walls']) => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    walls.forEach(([x1, y1, x2, y2]: [number, number, number, number]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  };

  // 绘制Room的函数
export  const drawRoom = (ctx: CanvasRenderingContext2D, room: Room) => {
    ctx.strokeStyle = room.isTemporary ? 'gray' : 'darkgray';
    ctx.lineWidth = 2;

    room.walls.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  };

const drawSingleTable = (
  ctx: CanvasRenderingContext2D, 
  type: TableType, 
  fillStyle: string, 
  strokeStyle: string
) => {
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;

  switch (type) {
    case 'square':
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeRect(-8, -8, 16, 16);
      break;
    case 'diamond':
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.rotate(-Math.PI / 4);
      break;
    case 'round':
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
  }
};

const drawChairs = (
  ctx: CanvasRenderingContext2D, 
  table: Room['tables'][number], 
  strokeStyle: string
) => {
  table.chairs.forEach((chair, chairIndex) => {
    if (chair) {
      let cx, cy;
      if (table.type === 'round') {
        const angle = (chairIndex / table.chairs.length) * Math.PI * 2 - Math.PI / 2;
        cx = Math.cos(angle) * 12;
        cy = Math.sin(angle) * 12;
      } else {
        const chairPositions = table.type === 'diamond' 
          ? [[8.5, -8.5], [8.5, 8.5], [-8.5, 8.5], [-8.5, -8.5]]
          : [[0, -12], [12, 0], [0, 12], [-12, 0]];
        [cx, cy] = chairPositions[chairIndex % chairPositions.length];
      }
      
      ctx.fillStyle = 'white';
      ctx.strokeStyle = strokeStyle;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } 
  });
};


export const drawTables = (
  ctx: CanvasRenderingContext2D, 
  tables: Room['tables'],
  selectedTable: { roomId: number; tableIndex: number } | null = null,
  tempMovePosition: { x: number; y: number } | null = null
) => {
  tables.forEach((table, index) => {
    ctx.save();
    ctx.translate(table.x, table.y);

    const isSelected = selectedTable && selectedTable.tableIndex === index;
    const strokeStyle = isSelected ? 'lightblue' : 'black';

    drawSingleTable(ctx, table.type, 'white', strokeStyle);
    drawChairs(ctx, table, strokeStyle);

    ctx.restore();
  });

  // 绘制临时移动位置的桌子
  if (selectedTable && tempMovePosition) {
    ctx.save();
    ctx.translate(tempMovePosition.x, tempMovePosition.y);

    const selectedTableData = tables[selectedTable.tableIndex];

    drawSingleTable(ctx, selectedTableData.type, 'lightgrey', 'lightgrey');
    drawChairs(ctx, selectedTableData, 'lightgrey');

    ctx.restore();
  }
};