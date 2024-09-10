import { click } from '@testing-library/user-event/dist/click';
import React, { useState, useRef, useEffect } from 'react';

type TableType = 'square' | 'diamond' | 'round';

interface Room {
  id: number;
  name: string;
  walls: [number, number, number, number][];
  tables: { x: number; y: number; type: TableType; chairs: boolean[] }[];
  subRooms: Room[];
  isTemporary: boolean;
}

const RoomList: React.FC<{
  rooms: Room[];
  onDeleteRoom: (roomId: number) => void;
  onRenameRoom: (roomId: number, newName: string) => void;
  level?: number;
}> = ({ rooms, onDeleteRoom, onRenameRoom, level = 0 }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');

  const handleRename = (room: Room) => {
    setEditingId(room.id);
    setNewName(room.name);
  };

  const submitRename = (room: Room) => {
    if (newName.trim() !== '') {
      onRenameRoom(room.id, newName.trim());
    }
    setEditingId(null);
  };

  return (
    <ul style={{ listStyleType: 'none', padding: level ? '0 0 0 20px' : 0 }}>
      {rooms.map((room) => (
        <li key={room.id} style={{ marginBottom: '10px' }}>
          <div className="room-item">
            <div className="room-info">
              {editingId === room.id ? (
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => submitRename(room)}
                  onKeyDown={(e) => e.key === 'Enter' && submitRename(room)}
                  autoFocus
                />
              ) : (
                <span className="room-name">{room.id === 0 ? 'TotalTable' : room.name}: </span>
              )}
              {!room.isTemporary && <span className="table-count">{room.tables.length} tables</span>}
            </div>
            {room.id !== 0 && !room.isTemporary && (
              <div className="room-actions">
                <button onClick={() => handleRename(room)}>重命名</button>
                <button onClick={() => onDeleteRoom(room.id)}>删除</button>
              </div>
            )}
          </div>
          {room.subRooms.length > 0 && (
            <RoomList 
              rooms={room.subRooms} 
              onRenameRoom={onRenameRoom} 
              onDeleteRoom={onDeleteRoom} 
              level={level + 1} 
            />
          )}
        </li>
      ))}
    </ul>
  );
};


const RestaurantLayout: React.FC = () => {
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(800);
  const unit = 20;
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 0,
      name: 'TotalTable',
      walls: [
        [0, 0, width, 0],       // 上边
        [width, 0, width, height], // 右边
        [width, height, 0, height], // 下边
        [0, height, 0, 0]       // 左边
      ],
      tables: [],
      subRooms: [],
      isTemporary: false
    }
  ]);
  const [currentTool, setCurrentTool] = useState<'wall' | 'eraser' | 'table' |  'room' | null>(null);
  const [isToolInUse, setIsToolInUse] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number } | null>(null);
  // for tables
  const [selectedTableType, setSelectedTableType] = useState<TableType>('square');
  const [canAddTable, setCanAddTable] = useState(false);
  // for rooms
  const [roomPoints, setRoomPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawingRoom, setIsDrawingRoom] = useState(false);
  const [drawingRoomPoints, setDrawingRoomPoints] = useState<{x: number, y: number}[]>([]);
  const [isAddingTable, setIsAddingTable] = useState(false);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx);
    drawWalls(ctx, rooms[0].walls);
    drawTables(ctx, rooms[0].tables);

    // 绘制Room的第一个点
    if (isDrawingRoom && drawingRoomPoints.length > 0) {
      const firstPoint = drawingRoomPoints[0];
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(firstPoint.x, firstPoint.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 递归绘制Room
    const drawRoomRecursive = (room: Room) => {
      drawRoom(ctx, room);
      drawTables(ctx, room.tables);
      room.subRooms.forEach(drawRoomRecursive);
    };

    rooms.forEach(drawRoomRecursive);

    // 只有在 firstPoint 存在且当前工具是 'wall' 时才绘制临时点
    if (firstPoint && currentTool === 'wall') {
      drawTempPoint(ctx, firstPoint.x, firstPoint.y);
    }
  };

  // 绘制grid的函数
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
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
  const drawWalls = (ctx: CanvasRenderingContext2D, walls: Room['walls']) => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    walls.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  };

  // 绘制Room的函数
  const drawRoom = (ctx: CanvasRenderingContext2D, room: Room) => {
    ctx.strokeStyle = room.isTemporary ? 'gray' : 'darkgray';
    ctx.lineWidth = 2;

    room.walls.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  };

 // 添加新的绘制函数来展示不同类型的桌子
 const drawTableOption = (ctx: CanvasRenderingContext2D, type: TableType, x: number, y: number, isSelected: boolean) => {
  ctx.save();
  ctx.translate(x, y);
    // 绘制选中状态的圆角方框
    if (isSelected) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-20, -20, 40, 40, 5);
      ctx.stroke();
    }
  let chairPositions = [];
  switch (type) {
    case 'square':
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeRect(-5, -5, 10, 10);
    chairPositions = [
      [0, -10],  [10, 0], 
      [0, 10],  [-10, 0]
    ];
    chairPositions.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
      break;
    case 'diamond':
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.strokeRect(-5, -5, 10, 10);
      chairPositions = [
        [0, -10],  [10, 0], 
        [0, 10],  [-10, 0]
      ];
      chairPositions.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      break;
    case 'round':
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
        ctx.stroke();
        // 绘制6个椅子
        chairPositions = [
          [0, -10], [8.66, -5], [8.66, 5],
          [0, 10], [-8.66, 5], [-8.66, -5]
        ];
        chairPositions.forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        break;
    }
    ctx.restore();
  };

  // 实现绘制桌椅的函数
  const drawTables = (ctx: CanvasRenderingContext2D, tables: Room['tables']) => {
  tables.forEach(table => {
    ctx.save();
    ctx.translate(table.x, table.y);

    // 绘制桌子
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    switch (table.type) {
      case 'square':
        ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeRect(-5, -5, 10, 10);
        break;
      case 'diamond':
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeRect(-5, -5, 10, 10);
        ctx.rotate(-Math.PI / 4); // 恢复旋转以正确绘制椅子
        break;
      case 'round':
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
    }

    // 绘制椅子
    table.chairs.forEach((chair, index) => {
      if (chair) {
        let cx, cy;
        if (table.type === 'round') {
          const angle = (index / table.chairs.length) * Math.PI * 2 - Math.PI / 2;
          cx = Math.cos(angle) * 10;
          cy = Math.sin(angle) * 10;
        } else {
          const chairPositions = table.type === 'diamond' 
            ? [[7.07, -7.07], [7.07, 7.07],
            [-7.07, 7.07], [-7.07, -7.07]]  // 菱形桌子的椅子位置
            : [[0, -10], [10, 0], [0, 10], [-10, 0]]; // 方形桌子的椅子位置
          [cx, cy] = chairPositions[index % chairPositions.length];
        }
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } 
    });

    ctx.restore();
  });
};

  // 添加渲染函数来展示桌子选项
  const renderTableOptions = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawTableOption(ctx, 'square', 25, 25, selectedTableType === 'square');
      drawTableOption(ctx, 'diamond', 75, 25, selectedTableType === 'diamond');
      drawTableOption(ctx, 'round', 125, 25, selectedTableType === 'round');
    }
    return canvas;
  };

  const handleTableOptionClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < 50) setSelectedTableType('square');
    else if (x < 100) setSelectedTableType('diamond');
    else setSelectedTableType('round');
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

    if (currentTool === 'table') {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      const gridAlignedX = Math.round(clickX / unit) * unit;
      const gridAlignedY = Math.round(clickY / unit) * unit;
    
      setRooms(prevRooms => {
        let chairUpdated = false;
        let tableDeleted = false;
        let isNearby = false;
    
        const updateRoomRecursive = (room: Room): Room => {
          // 首先处理当前Room的桌子
          const updatedTables = room.tables.filter(table => {
            const dx = table.x - clickX;
            const dy = table.y - clickY;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
              if (table.type === 'round') {
                const newSeatCount = prompt('输入座位数量 (2-8):', table.chairs.length.toString());
                if (newSeatCount) {
                  const count = Math.max(2, Math.min(8, parseInt(newSeatCount, 10)));
                  return {
                    ...table,
                    chairs: Array(count).fill(true)
                  };
                }
              } 
            } else if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
              tableDeleted = true;
              return false; // Delete桌子
            } else if (clickInSquare(table.x, table.y, clickX, clickY)) {
              const updatedChairs = [...table.chairs];
              if (Math.abs(dy) > Math.abs(dx)) {
                // 上或下
                if (dy > 0) {
                  updatedChairs[0] = !table.chairs[0]; // 上
                } else {
                  updatedChairs[2] = !table.chairs[2]; // 下
                }
              } else {
                // 左或右
                if (dx < 0) updatedChairs[1] = !table.chairs[1]; // 右
                else updatedChairs[3] = !table.chairs[3]; // 左
              }
              chairUpdated = true;
              return { ...table, chairs: updatedChairs };
            }
            if (Math.abs(table.x - clickX) < 40 && Math.abs(table.y - clickY) < 40) isNearby = true;
            return table;
          });
    
          // 然后递归处理子Room
          const updatedSubRooms = room.subRooms.map(updateRoomRecursive);
    
          return { ...room, tables: updatedTables, subRooms: updatedSubRooms };
        };
    
        const updatedRooms = prevRooms.map(updateRoomRecursive);
    
        if (!chairUpdated && !tableDeleted && !isNearby) {
          // 如果没有更新椅子且没有删除桌子且点击位置没有桌子且不在其他桌子附近，添加新桌子
          const addTableToRoom = (room: Room): Room => {
            // 首先检查所有子房间
            for (let subRoom of room.subRooms) {
              if (isPointInPolygon(gridAlignedX, gridAlignedY, subRoom.walls.map(([x1, y1]) => ({ x: x1, y: y1 })))) {
                // 如果点击在子房间内，递归调用addTableToRoom
                return {
                  ...room,
                  subRooms: room.subRooms.map(r => r.id === subRoom.id ? addTableToRoom(r) : r)
                };
              }
            }
            
            // 如果不在任何子房间内，检查是否在当前房间内
            if (isPointInPolygon(gridAlignedX, gridAlignedY, room.walls.map(([x1, y1]) => ({ x: x1, y: y1 })))) {
              // 在当前房间内，添加新桌子
              return {
                ...room,
                tables: [...room.tables, { 
                  x: gridAlignedX, 
                  y: gridAlignedY, 
                  type: selectedTableType,
                  chairs: selectedTableType === 'round' ? Array(6).fill(true) : [true, true, true, true] 
                }]
              };
            }
            
            // 如果既不在子房间也不在当前房间，返回原始房间
            return room;
          };
          
          // 从顶层房间开始应用addTableToRoom函数
          return updatedRooms.map(addTableToRoom);
          setCanAddTable(false);
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
            id: prevRooms.length, 
            name: `Room${prevRooms.length}`,
            walls: [newWall], 
            tables: [],
            subRooms: [],
            isTemporary: true
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
    } else if (currentTool === 'room') {

      const rect = canvas.getBoundingClientRect();
      const clickX = Math.round((event.clientX - rect.left) / unit) * unit;
      const clickY = Math.round((event.clientY - rect.top) / unit) * unit;
  
      setDrawingRoomPoints(prevPoints => {
        if (!isDrawingRoom) {
          setIsDrawingRoom(true);
          const newPoints = [{ x: clickX, y: clickY }];
          // 立即重绘画布以显示红点
          setTimeout(() => redrawCanvas(), 0);
          return newPoints;
        }
  
        const newPoints = [...prevPoints, { x: clickX, y: clickY }];
        if (newPoints.length > 2 && 
            newPoints[0].x === clickX && 
            newPoints[0].y === clickY && 
            newPoints.length >= 3) {
          // 完成Room创建
          createNewRoom(newPoints);
          return [];
        }
  
        // 创建临时Room
        if (newPoints.length > 1) {
          const tempWalls = newPoints.map((point, index, arr) => {
            const nextPoint = arr[(index + 1) % arr.length];
            return [point.x, point.y, nextPoint.x, nextPoint.y] as [number, number, number, number];
          });
          setRooms(prevRooms => {
            const newRoomId = prevRooms.length - 1;
            return [
              ...prevRooms.filter(r => !r.isTemporary),
              { 
                id: newRoomId, 
                name: `Room${newRoomId}`,
                walls: tempWalls, 
                tables: [], 
                subRooms: [], 
                isTemporary: true 
              }
            ];
          });
        }
        return newPoints;
      });
    }
  };

  // 方向clickInSquare
  const clickInSquare = (tableX: number, tableY: number, clickX: number, clickY: number) => {
    const isY = Math.abs(tableX - clickX) <= unit;
    const isX = Math.abs(tableY - clickY) <= unit;
    return isX && isY;
  }

  // 添加Reset函数
  const handleReset = () => {
    setRooms([
      {
        id: 0,
        name: 'Room0',
        walls: [
          [0, 0, width, 0],       // 上边
          [width, 0, width, height], // 右边
          [width, height, 0, height], // 下边
          [0, height, 0, 0]       // 左边
        ],
        tables: [],
        subRooms: [],
        isTemporary: false
      }
    ]);
    setCurrentTool(null);
    setIsToolInUse(false);
    setFirstPoint(null);
    setRoomPoints([]);
    setIsDrawingRoom(false);
    setDrawingRoomPoints([]);
    setCanAddTable(false);
  };

  const handleToolSelect = (tool: 'wall' | 'eraser' | 'table' | 'room')  => {
    if (isToolInUse && currentTool === 'wall' && firstPoint) {
      alert('请先完成当前操作');
      return;
    }
    if (isDrawingRoom) {
      alert('请先完成当前Room的绘制');
      return;
    }
    
    // 如果当前工具是 'wall'，并且正在切换到另一个，重置 firstPoint
    if (currentTool === 'wall' && tool !== 'wall') {
      setFirstPoint(null);
    }
    
    setCurrentTool(tool);
    setIsToolInUse(tool === 'wall');
    setCanAddTable(false);
  };

  const handleAddButtonClick = () => {
    if (currentTool === 'table') {
      setCanAddTable(true);
      setIsAddingTable(true);
    }
  };

  // 添Add一个辅助函数来计算点到线段的距离
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

  // 添Add一个 useEffect 来监听 rooms 的变化
  useEffect(() => {
    redrawCanvas();
  }, [rooms]);

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
        id: prevRooms.length,  // 使用当前Room数量作为新 ID
        name: `Room${prevRooms.length}`,
        walls,
        tables: tablesInNewRoom,
        subRooms: [],
        isTemporary: false
      };

      return [
        { ...parentRoom, tables: tablesOutsideNewRoom, subRooms: [...parentRoom.subRooms, newRoom] },
        ...prevRooms.slice(1).filter(r => !r.isTemporary)
      ];
    });

    setIsDrawingRoom(false);
    setCurrentTool(null);
    setDrawingRoomPoints([]);
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
            // 将要Delete的Room的桌子和子Room的桌子都移到父Room
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

  const handleRenameRoom = (roomId: number, newName: string) => {
    setRooms(prevRooms => {
      const updateRoomRecursive = (rooms: Room[]): Room[] => {
        return rooms.map(room => {
          if (room.id === roomId) {
            return { ...room, name: newName };
          }
          if (room.subRooms.length > 0) {
            return { ...room, subRooms: updateRoomRecursive(room.subRooms) };
          }
          return room;
        });
      };
  
      return updateRoomRecursive(prevRooms);
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
    <div style={{ display: 'flex'}}>
      <RoomList rooms={rooms} onRenameRoom={handleRenameRoom} onDeleteRoom={handleDeleteRoom} />
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
          AddWall
        </button>
        <button 
          onClick={() => handleToolSelect('eraser')}
          style={{ 
            ...buttonStyle,
            backgroundColor: currentTool === 'eraser' ? 'lightblue' : 'white' 
          }}
        >
          DeleteWall
        </button>
        <button 
          onClick={() => handleToolSelect('table')}
          style={{ 
            ...buttonStyle,
            backgroundColor: currentTool === 'table' ? 'lightblue' : 'white' 
          }}
        >
            AddTable
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
            AddRoom
          </button>
          <button onClick={handleReset} style={buttonStyle}>
            Reset
          </button>
          <button onClick={handleExport} style={buttonStyle}>
            Export
          </button>
          <button onClick={handleImport} style={buttonStyle}>
            Import
          </button>
        </div>
        {currentTool === 'table' && (
      <div>
      <div>
        <button onClick={handleAddButtonClick}>Add</button>
        <button onClick={() => {/* 合并桌子逻辑 */}}>Merge</button>
        <button onClick={() => {/* 编辑椅子逻辑 */}}>EditChairs</button>
        <button onClick={() => {/* 删除桌子逻辑 */}}>Delete</button>
      </div>
      {isAddingTable && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={renderTableOptions().toDataURL()} 
            alt="Table options" 
            onClick={handleTableOptionClick}
            style={{ cursor: 'pointer' }}
          />
          <select 
            value={selectedTableType} 
            onChange={(e) => setSelectedTableType(e.target.value as TableType)}
          >
            <option value="square">square table</option>
            <option value="diamond">diamond table</option>
            <option value="round">round table</option>
          </select>
        </div>
      )}
    </div>
        )}
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