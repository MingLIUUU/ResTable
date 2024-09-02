import { click } from '@testing-library/user-event/dist/click';
import React, { useState, useRef, useEffect } from 'react';

interface Room {
  id: string;
  walls: [number, number, number, number][];
  tables: { x: number; y: number; chairs: boolean[] }[];
}

const RestaurantLayout: React.FC = () => {
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(800);
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 'Room0',
      walls: [
        [0, 0, width, 0],       // 上边
        [width, 0, width, height], // 右边
        [width, height, 0, height], // 下边
        [0, height, 0, 0]       // 左边
      ],
      tables: []
    }
  ]);
  const [currentTool, setCurrentTool] = useState<'wall' | 'eraser' | 'table' | null>(null);
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number } | null>(null);
  const [isToolInUse, setIsToolInUse] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const limit = 20;

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx);
    rooms.forEach(room => {
      drawRoom(ctx, room);
      drawTables(ctx, room.tables);
    });

    // 只有在 firstPoint 存在且当前工具是 'wall' 时才绘制临时点
    if (firstPoint && currentTool === 'wall') {
      drawTempPoint(ctx, firstPoint.x, firstPoint.y);
    }
  };

  // 实现绘制网格的函数
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgb(192, 192, 192)'; // 75% 的灰色
    ctx.lineWidth = 1;

    const gridSize = limit; // 网格大小

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

  // 现绘制房间的函数
  const drawRoom = (ctx: CanvasRenderingContext2D, room: Room) => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    room.walls.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  };


  // 实现绘制桌椅的函数
  const drawTables = (ctx: CanvasRenderingContext2D, tables: Room['tables']) => {
    tables.forEach(table => {
      // 绘制���子
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.fillRect(table.x - 5, table.y - 5, 10, 10); 
      ctx.strokeRect(table.x - 5, table.y - 5, 10, 10); 

      // 绘制椅子
      table.chairs.forEach((chair, index) => {
          if (chair) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            switch (index) {
              case 0: // 上
                ctx.arc(table.x, table.y - 10, 5, Math.PI, 0);
                break;
              case 1: // 右
                ctx.arc(table.x + 10, table.y, 5, Math.PI * 1.5, Math.PI * 0.5);
                break;
              case 2: // 下
                ctx.arc(table.x, table.y + 10, 5, 0, Math.PI);
                break;
              case 3: // 左
                ctx.arc(table.x - 10, table.y, 5, Math.PI * 0.5, Math.PI * 1.5);
                break;
            }
            ctx.fill();  // 填充白色
            ctx.stroke();  // 绘制黑色边框
          } 
      });
    });
  };

  // 现绘制临时点的函数
  const drawTempPoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // 处理鼠标单击事件的函数
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (currentTool == 'table') {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const gridAlignedX = Math.round(clickX / limit) * limit;
    const gridAlignedY = Math.round(clickY / limit) * limit;

    setRooms(prevRooms => {
      let chairUpdated = false;
      let tableDeleted = false;
      let isNearby = false;

      const updatedRooms = prevRooms.map(room => {
        const updatedTables = room.tables.filter(table => {
          const dx = table.x - clickX;
          const dy = table.y - clickY;
          if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
            tableDeleted = true;
            return false; // 删除桌子
          } else if (clickInSquare(table.x, table.y, clickX, clickY)) {
            const updatedChairs = table.chairs;
            if (Math.abs(dy) > Math.abs(dx)) {
              // 上或下
              if (dy > 0) {
                updatedChairs[0] = !table.chairs[0]; // 上
                console.log(updatedChairs[0]);
              } else {
                updatedChairs[2] = !table.chairs[2]; // 下
              }
            } else {
              // 左或右
              if (dx > 0) updatedChairs[1] = !table.chairs[1]; // 右
              else updatedChairs[3] = !table.chairs[3]; // 左
            }
            chairUpdated = true;
            return { ...table, chairs: updatedChairs };
          }
          if (Math.abs(table.x - clickX) < 40 && Math.abs(table.y - clickY) < 40) isNearby = true;
          return true;
        });
        return { ...room, tables: updatedTables };
      });
      if (!chairUpdated && !tableDeleted && !isNearby) {
        // 如果没有更新椅子且没有删除桌子且点击位置没有桌子且不在其他桌子附近，添加新桌子
        updatedRooms.forEach(room => {
          room.tables.push({ x: gridAlignedX, y: gridAlignedY, chairs: [true, true, true, true] });
        });
      }
      return updatedRooms;
    });
  }
  };

  // 处理双击事件的函数
  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (currentTool === 'wall') {
      if (!firstPoint) {
        setFirstPoint({ x: clickX, y: clickY });
        const ctx = canvas.getContext('2d');
        if (ctx) drawTempPoint(ctx, clickX, clickY);
      } else {
        setRooms(prevRooms => {
          const newWall = [firstPoint.x, firstPoint.y, clickX, clickY] as [number, number, number, number];
          const newRoom: Room = { 
            id: Date.now().toString(), 
            walls: [newWall], 
            tables: [] 
          };
          setFirstPoint(null);
          setIsToolInUse(false);
          return [...prevRooms, newRoom];
        });
      }
    } else if (currentTool === 'eraser') {
      setRooms(prevRooms => {
        const updatedRooms = prevRooms.map(room => {
          const updatedWalls = room.walls.filter(([x1, y1, x2, y2]) => {
            const distance = pointToLineDistance(clickX, clickY, x1, y1, x2, y2);
            return distance > 5;
          });
          return { ...room, walls: updatedWalls };
        }).filter(room => room.walls.length > 0);

        return updatedRooms;
      });
    }
  };

  // 方向clickInSquare
  const clickInSquare = (tableX: number, tableY: number, clickX: number, clickY: number) => {
    const isY = Math.abs(tableX - clickX) <= limit;
    const isX = Math.abs(tableY - clickY) <= limit;
    return isX && isY;
  }

  // 添加重置函数
  const handleReset = () => {
    setRooms([
      {
        id: 'Room0',
        walls: [
          [0, 0, width, 0],       // 上边
          [width, 0, width, height], // 右边
          [width, height, 0, height], // 下边
          [0, height, 0, 0]       // 左边
        ],
        tables: []
      }
    ]);
    setCurrentTool(null);
    setIsToolInUse(false);
    setFirstPoint(null);
  };

  const handleToolSelect = (tool: 'wall' | 'eraser' | 'table') => {
    if (isToolInUse && currentTool === 'wall' && firstPoint) {
      alert('请先完成当前画墙操作');
      return;
    }
    
    // 如果当前工具是 'wall'，并且正在切换到另一个，重置 firstPoint
    if (currentTool === 'wall' && tool !== 'wall') {
      setFirstPoint(null);
    }
    
    setCurrentTool(tool);
    setIsToolInUse(tool === 'wall');
  };

  // 添加一个辅助函数来计算点到线段的距离
  const pointToLineDistance = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) // 防止除以0
      param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    }
    else if (param > 1) {
      xx = x2;
      yy = y2;
    }
    else {
      xx = x1 + param * C;
      yy = y1 + D * param;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const buttonStyle: React.CSSProperties = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  // 添加一个 useEffect 来监听 rooms 的变化
  useEffect(() => {
    redrawCanvas();
  }, [rooms]);

  return (
    <div>
      <div>
        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
        />
      </div>
      <div>
        <button 
          onClick={() => handleToolSelect('wall')}
          style={{ 
            ...buttonStyle,
            backgroundColor: currentTool === 'wall' ? 'lightblue' : 'white' 
          }}
        >
          画墙
        </button>
        <button 
          onClick={() => handleToolSelect('eraser')}
          style={{ 
            ...buttonStyle,
            backgroundColor: currentTool === 'eraser' ? 'lightblue' : 'white' 
          }}
        >
          擦除
        </button>
        <button 
          onClick={() => handleToolSelect('table')}
          style={{ 
            ...buttonStyle,
            backgroundColor: currentTool === 'table' ? 'lightblue' : 'white' 
          }}
        >
          加桌子
        </button>
        <button onClick={handleReset} style={buttonStyle}>
          重置
        </button>
        </div>
        <div style={{ display: 'flex' }}>
        <div style={{ width: '200px', marginRight: '20px' }}>
          <h3>桌子和椅子状态</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {rooms.flatMap((room, roomIndex) => 
              room.tables.map((table, tableIndex) => (
                <li key={`${room.id}-${tableIndex}`}>
                  桌子 {tableIndex + 1}: 
                  {table.chairs.map((chair, chairIndex) => 
                    chair ? `椅${chairIndex + 1} ` : ''
                  ).join('')}
                </li>
              ))
            )}
          </ul>
        </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        style={{ border: '1px solid black' }}
      />
    </div>
  </div>
  );
};

export default RestaurantLayout;