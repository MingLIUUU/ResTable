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

