import { click } from '@testing-library/user-event/dist/click';
import React, { useState, useRef, useEffect } from 'react';

interface Room {
  id: number;
  walls: [number, number, number, number][];
  tables: { x: number; y: number; chairs: boolean[] }[];
  subRooms: Room[];
  isTemporary?: boolean;
}

const RoomList: React.FC<{
  rooms: Room[];
  onDeleteRoom: (roomId: number) => void;
  level?: number;
}> = ({ rooms, onDeleteRoom, level = 0 }) => {
  return (
    <ul style={{ listStyleType: 'none', padding: level ? '0 0 0 20px' : 0 }}>
      {rooms.map((room) => (
        <li key={room.id} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {room.id === 0 ? '主房间' : `房间 ${room.id}`}
            {!room.isTemporary && `: ${room.tables.length} 张桌子`}
            {room.id !== 0 && !room.isTemporary && (
              <button onClick={() => onDeleteRoom(room.id)}>删除</button>
            )}
          </div>
          {room.subRooms.length > 0 && (
            <RoomList rooms={room.subRooms} onDeleteRoom={onDeleteRoom} level={level + 1} />
          )}
        </li>
      ))}
    </ul>
  );
};

const RestaurantLayout: React.FC = () => {
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(800);
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 0,
      walls: [
        [0, 0, width, 0],       // 上边
        [width, 0, width, height], // 右边
        [width, height, 0, height], // 下边
        [0, height, 0, 0]       // 左边
      ],
      tables: [],
      subRooms: []
    }
  ]);
  const [currentTool, setCurrentTool] = useState<'wall' | 'eraser' | 'table' | 'room' | null>(null);
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number } | null>(null);
  const [isToolInUse, setIsToolInUse] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const limit = 20;
  const [roomPoints, setRoomPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawingRoom, setIsDrawingRoom] = useState(false);
  const [drawingRoomPoints, setDrawingRoomPoints] = useState<{x: number, y: number}[]>([]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx);

    const drawRoomRecursive = (room: Room) => {
      drawRoom(ctx, room);
      drawTables(ctx, room.tables);
      room.subRooms.forEach(drawRoomRecursive);
    };

    rooms.forEach(drawRoomRecursive);
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
    ctx.strokeStyle = room.isTemporary ? 'gray' : 'darkgray';
    ctx.lineWidth = 2;

    room.walls.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    if (room.isTemporary) {
      room.walls.forEach(([x1, y1]) => {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  };


  // 实现绘制桌椅的函数
  const drawTables = (ctx: CanvasRenderingContext2D, tables: Room['tables']) => {
    tables.forEach(table => {
      // 绘制子
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
    if (currentTool === 'room') {
      handleRoomCreation(event);
    } else if (currentTool === 'table') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      const gridAlignedX = Math.round(clickX / limit) * limit;
      const gridAlignedY = Math.round(clickY / limit) * limit;

      setRooms(prevRooms => {
        let tableAdded = false;
        const updatedRooms = prevRooms.map(room => {
          // 检查点击是否在当前房间内
          const isInRoom = room.walls.length > 0 
            ? isPointInPolygon(gridAlignedX, gridAlignedY, room.walls.map(([x1, y1]) => ({ x: x1, y: y1 })))
            : true; // 对于父房间（没有明确的墙），假设总是在内部

          if (isInRoom) {
            // 检查是否在现有桌子附近
            const isNearExistingTable = room.tables.some(table => 
              Math.abs(table.x - gridAlignedX) < 40 && Math.abs(table.y - gridAlignedY) < 40
            );

            if (!isNearExistingTable && !tableAdded) {
              // 添加新桌子
              const newTable = { 
                x: gridAlignedX, 
                y: gridAlignedY, 
                chairs: [true, true, true, true] 
              };
              tableAdded = true;
              return { ...room, tables: [...room.tables, newTable] };
            }
          }
          return room;
        });

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
            id: prevRooms.length, 
            walls: [newWall], 
            tables: [],
            subRooms: []
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
        id: 0,
        walls: [
          [0, 0, width, 0],       // 上边
          [width, 0, width, height], // 右边
          [width, height, 0, height], // 下边
          [0, height, 0, 0]       // 左边
        ],
        tables: [],
        subRooms: []
      }
    ]);
    setCurrentTool(null);
    setIsToolInUse(false);
    setFirstPoint(null);
    setRoomPoints([]);
    setIsDrawingRoom(false);
    setDrawingRoomPoints([]);
  };

  const handleToolSelect = (tool: 'wall' | 'eraser' | 'table' | 'room') => {
    if (isDrawingRoom) {
      alert('请先完成当前房间的绘制');
      return;
    }
    // 如果当前工具是 'wall'，并且正在切换到另一个，重置 firstPoint
    if (currentTool === 'wall' && tool !== 'wall') {
      setFirstPoint(null);
    }
    
    setCurrentTool(tool);
    setIsToolInUse(tool === 'wall' || tool === 'room');
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
  }, [rooms, drawingRoomPoints]);

  const handleRoomCreation = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRoom) {
      setIsDrawingRoom(true);
      setCurrentTool('room');
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = Math.round((event.clientX - rect.left) / limit) * limit;
    const clickY = Math.round((event.clientY - rect.top) / limit) * limit;

    setDrawingRoomPoints(prevPoints => {
      if (!isDrawingRoom) {
        setIsDrawingRoom(true);
        return [{ x: clickX, y: clickY }];
      }

      const newPoints = [...prevPoints, { x: clickX, y: clickY }];
      if (newPoints.length > 2 && 
          newPoints[0].x === clickX && 
          newPoints[0].y === clickY && 
          newPoints.length >= 3) {
        // 完成房间创建
        createNewRoom(newPoints);
        return [];
      }

      // 创建临时房间
      if (newPoints.length > 1) {
        const tempWalls = newPoints.map((point, index, arr) => {
          const nextPoint = arr[(index + 1) % arr.length];
          return [point.x, point.y, nextPoint.x, nextPoint.y] as [number, number, number, number];
        });
        setRooms(prevRooms => [
          ...prevRooms.filter(r => !r.isTemporary),
          { id: -1, walls: tempWalls, tables: [], subRooms: [], isTemporary: true }
        ]);
      }

      return newPoints;
    });
  };

  const createNewRoom = (points: { x: number; y: number }[]) => {
    const walls = points.map((point, index, arr) => {
      const nextPoint = arr[(index + 1) % arr.length];
      return [point.x, point.y, nextPoint.x, nextPoint.y] as [number, number, number, number];
    });

    setRooms(prevRooms => {
      const parentRoom = prevRooms[0];
      const tablesInNewRoom = parentRoom.tables.filter(table => 
        isPointInPolygon(table.x, table.y, points)
      );
      const tablesOutsideNewRoom = parentRoom.tables.filter(table => 
        !isPointInPolygon(table.x, table.y, points)
      );

      const newRoom: Room = {
        id: prevRooms.length,  // 使用当前房间数量作为新 ID
        walls,
        tables: tablesInNewRoom,
        subRooms: []
      };

      return [
        { ...parentRoom, tables: tablesOutsideNewRoom, subRooms: [...parentRoom.subRooms, newRoom] },
        ...prevRooms.slice(1).filter(r => !r.isTemporary)
      ];
    });

    setIsDrawingRoom(false);
    setCurrentTool(null);
  };

  const isPointInPolygon = (x: number, y: number, polygon: { x: number; y: number }[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleDeleteRoom = (roomId: number) => {
    setRooms(prevRooms => {
      const deleteRoomRecursive = (rooms: Room[]): Room[] => {
        return rooms.map(room => {
          if (room.id === roomId) {
            // 将要删除的房间的桌子和子房间的桌子都移到父房间
            const allTables = [...room.tables, ...room.subRooms.flatMap(subRoom => subRoom.tables)];
            return { ...room, tables: allTables, subRooms: [] };
          }
          if (room.subRooms.some(subRoom => subRoom.id === roomId)) {
            const updatedSubRooms = deleteRoomRecursive(room.subRooms);
            const deletedRoom = room.subRooms.find(subRoom => subRoom.id === roomId);
            return {
              ...room,
              tables: [...room.tables, ...(deletedRoom?.tables || [])],
              subRooms: updatedSubRooms.filter(subRoom => subRoom.id !== roomId)
            };
          }
          return { ...room, subRooms: deleteRoomRecursive(room.subRooms) };
        });
      };

      return deleteRoomRecursive(prevRooms);
    });
  };

  const handleExport = () => {
    const layoutData = JSON.stringify(rooms);
    const blob = new Blob([layoutData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restaurant_layout.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
            const importedRooms = JSON.parse(content) as Room[];
            // 重置当前布局并导入新布局
            setRooms(importedRooms);
            // 重置其他相关状态
            setCurrentTool(null);
            setIsDrawingRoom(false);
            setDrawingRoomPoints([]);
          } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败，请确保文件格式正确。');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div style={{ display: 'flex' }}>
      <RoomList rooms={rooms} onDeleteRoom={handleDeleteRoom} />
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
            disabled={isDrawingRoom}
            style={{ 
              ...buttonStyle,
              backgroundColor: currentTool === 'wall' ? 'lightblue' : 'white',
              opacity: isDrawingRoom ? 0.5 : 1
            }}
          >
            画墙
          </button>
          <button 
            onClick={() => handleToolSelect('eraser')}
            disabled={isDrawingRoom}
            style={{ 
              ...buttonStyle,
              backgroundColor: currentTool === 'eraser' ? 'lightblue' : 'white',
              opacity: isDrawingRoom ? 0.5 : 1
            }}
          >
            擦除
          </button>
          <button 
            onClick={() => handleToolSelect('table')}
            disabled={isDrawingRoom}
            style={{ 
              ...buttonStyle,
              backgroundColor: currentTool === 'table' ? 'lightblue' : 'white',
              opacity: isDrawingRoom ? 0.5 : 1
            }}
          >
            加桌子
          </button>
          <button 
            onClick={() => handleToolSelect('room')}
            disabled={isDrawingRoom}
            style={{ 
              ...buttonStyle,
              backgroundColor: currentTool === 'room' ? 'lightblue' : 'white',
              opacity: isDrawingRoom ? 0.5 : 1
            }}
          >
            加房间
          </button>
          <button onClick={handleReset} style={buttonStyle}>
            重置
          </button>
          <button onClick={handleExport} style={buttonStyle}>
            导出
          </button>
          <button onClick={handleImport} style={buttonStyle}>
            导入
          </button>
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