import { click } from '@testing-library/user-event/dist/click';
import React, { useState, useRef, useEffect } from 'react';
import { Room, TableType, Tool, TableSubTool, WallSubTool, RoomSubTool } from '../types';
import { isPointInPolygon, pointToLineDistance, snapToGrid, createSquarePolygon } from '../utils/math';
import { drawGrid, drawWalls, drawRoom, drawTempPoint, drawTables } from '../utils/drawFunctions';
import { RestaurantLayoutView } from './RestaurantLayoutView';
import { tab } from '@testing-library/user-event/dist/tab';

const RestaurantLayout: React.FC = () => {
  //for canvas
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(800);
  const unit = 20;
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 0,
      name: 'TotalTable',
      walls: [
        [0, 0, width, 0],      
        [width, 0, width, height], 
        [width, height, 0, height], 
        [0, height, 0, 0]      
      ],
      tables: [],
      subRooms: [],
      isTemporary: false
    }
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //for tool menu
  const [currentTool, setCurrentTool] = useState<Tool>(null);
  const [isToolInUse, setIsToolInUse] = useState(false);
  const [tableSubTool, setTableSubTool] = useState<TableSubTool>(null);
  const [selectedTableType, setSelectedTableType] = useState<TableType>('square');
  
  //for walls
  const [wallSubTool, setWallSubTool] = useState<'add' | 'delete' | null>(null);
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number } | null>(null);

  //for tables
  const [selectedTable, setSelectedTable] = useState<{ roomId: number; tableIndex: number, type: TableType, chairs: boolean[] } | null>(null);
  const [tempMovePosition, setTempMovePosition] = useState<{ x: number; y: number } | null>(null);

  // for rooms
  const [roomSubTool, setRoomSubTool] = useState<RoomSubTool>(null);
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
    drawGrid(ctx, width, height, unit);
    drawTables(ctx, rooms[0].tables, selectedTable, tempMovePosition);

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
    drawWalls(ctx, rooms[0].walls);
    
  };

 const drawTableOption = (ctx: CanvasRenderingContext2D, type: TableType, x: number, y: number, isSelected: boolean) => {
  ctx.save();
  ctx.translate(x, y);
    // 绘选中状态的圆角方框
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
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeRect(-8, -8, 16, 16);
      chairPositions = [
        [0, -11],  [11, 0], 
        [0, 11],  [-11, 0]
      ];
      break;
    case 'diamond':
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.rotate(-Math.PI / 4);
      chairPositions = [
        [8, -8],  [8, 8], 
        [-8, 8],  [-8, -8]
      ];
      break;
    case 'round':
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 绘制6个椅子
      chairPositions = [
        [0, -11], [9.5, -5.5], [9.5, 5.5],
        [0, 11], [-9.5, 5.5], [-9.5, -5.5]
      ];
      break;
  }
  
  chairPositions.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
};

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


  const handleToolSelect = (tool: Tool)  => {
    if ((isToolInUse && currentTool === 'wall' && firstPoint) 
      || (isDrawingRoom))
       {
      alert('Finish the current operation first');
      return;
    }

    setTableSubTool(null);
    //setWallSubTool(null);
    //setRoomSubTool(null);

    // 如果当前工具是 'wall'，并且正在切换到另一个，重置 firstPoint
    if (currentTool === 'wall' && tool !== 'wall') {
      setFirstPoint(null);
    }
    
    setCurrentTool(tool);
    setIsToolInUse(tool === 'wall');

    // 根据选择的工具设置默认的子工具
    if (tool === 'table') {
      setTableSubTool('add');
      setIsAddingTable(true);
    } else {
      setIsAddingTable(false);
    }

    // 如果选择了 'room' 工具，设置 isDrawingRoom 为 true
    if (tool === 'room') {
      setIsDrawingRoom(true);
    } else {
      setIsDrawingRoom(false);
      setDrawingRoomPoints([]);
    }

    if (tool === 'wall') {
      setWallSubTool('add'); // 默认选择 'add' 子工具
    } else {
      setWallSubTool(null);
    }
  };

  const handleWallSubToolSelect = (subTool: WallSubTool) => {
    setWallSubTool(subTool);
  };

  const handleTableSubToolSelect = (subTool: TableSubTool) => {
    setTableSubTool(subTool);
  };

  // 处理单击事件的函数
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const [snappedX, snappedY] = snapToGrid(clickX, clickY, unit);
  
    if (currentTool === 'table' && tableSubTool === 'add') {
      setRooms(prevRooms => {
        const addTableToRoom = (room: Room): Room => {
          if (isPointInPolygon(snappedX, snappedY, room.walls.map(([x1, y1]) => ({ x: x1, y: y1 })))) {
            return {
              ...room,
              tables: [...room.tables, { 
                x: snappedX, 
                y: snappedY, 
                type: selectedTableType,
                chairs: selectedTableType === 'round' ? Array(6).fill(true) : [true, true, true, true] 
              }]
            };
          }
          return {
            ...room,
            subRooms: room.subRooms.map(addTableToRoom)
          };
        };
        
        return prevRooms.map(addTableToRoom);
      });
    } else if (currentTool === 'table' && tableSubTool === 'editChairs') {
      setRooms(prevRooms => {
        const updateRoomRecursive = (room: Room): Room => {
          const updatedTables = room.tables.map(table => {
            const tablesquare = createSquarePolygon(table.x, table.y, unit);
            if (isPointInPolygon(clickX, clickY, tablesquare)) {
              if (table.type === 'round') {
                const newSeatCount = prompt('输入座位数量 (2-8):', table.chairs.length.toString());
                if (newSeatCount) {
                  const count = Math.max(2, Math.min(8, parseInt(newSeatCount, 10)));
                  return {
                    ...table,
                    chairs: Array(count).fill(true)
                  };
                }
              } else if (table.type === 'square') {
                const updatedChairs = [...table.chairs];
                const dx = table.x - clickX;
                const dy = table.y - clickY;
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
                return { ...table, chairs: updatedChairs };
              }
            }
            return table;
          });

          return {
            ...room,
            tables: updatedTables,
            subRooms: room.subRooms.map(updateRoomRecursive)
          };
        };

        return prevRooms.map(updateRoomRecursive);
      });

      // 确保在状态更新后重新绘制画布
      setTimeout(() => redrawCanvas(), 0);
    } else if (currentTool === 'table' && tableSubTool === 'move') {
      if (selectedTable) {
        const isTableExist = rooms.some(room => 
          room.tables.some(table => table.x === snappedX && table.y === snappedY)
        );
  
        if (isTableExist) {
          alert('Table already exists,please choose another position');
          return;
        }
        setTempMovePosition({ x: snappedX, y: snappedY });
      }

    } else if (currentTool === 'wall') {
      if (wallSubTool === 'add') {
        if (!firstPoint) {
          setFirstPoint({ x: snappedX, y: snappedY });
          const ctx = canvas.getContext('2d');
          if (ctx) drawTempPoint(ctx, snappedX, snappedY);
        } else {
          setRooms(prevRooms => {
            const newWall = [firstPoint.x, firstPoint.y, snappedX, snappedY] as [number, number, number, number];
            return prevRooms.map(room => {
              if (room.id === 0) { // 主房间
                return {
                  ...room,
                  walls: [...room.walls, newWall]
                };
              }
              return room;
            });
          });
          setFirstPoint(null);
          setIsToolInUse(false);
        }
      } else if (wallSubTool === 'delete') {
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
    }
    redrawCanvas();
  };

  // 处理双击事件的函数
  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const [snappedX, snappedY] = snapToGrid(clickX, clickY, unit);
  
    if (currentTool === 'room') {

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
    } else if (currentTool === 'table' && tableSubTool === 'delete') {
      setRooms(prevRooms => {
        const deleteTableFromRoom = (room: Room): Room => {
          const updatedTables = room.tables.filter(table => {
            const tableSquare = createSquarePolygon(table.x, table.y, unit);
            return !isPointInPolygon(clickX, clickY, tableSquare);
          });
          return {
            ...room,
            tables: updatedTables,
            subRooms: room.subRooms.map(deleteTableFromRoom)
          };
        };
        return prevRooms.map(deleteTableFromRoom);
      });
    } else if (currentTool === 'table' && tableSubTool === 'move') {
      if (!selectedTable) {
        setRooms(prevRooms => {
          const newRooms = [...prevRooms];
          for (let i = 0; i < newRooms.length; i++) {
            const tableIndex = newRooms[i].tables.findIndex(table => 
              table.x === snappedX && table.y === snappedY
            );
            if (tableIndex !== -1) {
              const table = newRooms[i].tables[tableIndex];
              setSelectedTable({
                roomId: newRooms[i].id,
                tableIndex,
                type: table.type,
                chairs: table.chairs
              });
              return newRooms;
            }
          }
          redrawCanvas();
          return newRooms;
        });
      } else if (tempMovePosition) {
        setRooms(prevRooms => {
          const newRooms = [...prevRooms];
          const { roomId, tableIndex } = selectedTable;
          const roomIndex = newRooms.findIndex(room => room.id === roomId);
          if (roomIndex !== -1) {
            const movedTable = { ...newRooms[roomIndex].tables[tableIndex], x: tempMovePosition.x, y: tempMovePosition.y };
            newRooms[roomIndex].tables.splice(tableIndex, 1);
            const newRoomIndex = newRooms.findIndex(room => 
              isPointInPolygon(tempMovePosition.x, tempMovePosition.y, room.walls.map(([x1, y1]) => ({ x: x1, y: y1 })))
            );
            if (newRoomIndex !== -1) {
              newRooms[newRoomIndex].tables.push(movedTable);
            }
          }
          redrawCanvas();
          return newRooms;
        });
        setSelectedTable(null);
        setTempMovePosition(null);
        redrawCanvas();
      }
    }
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
    setTableSubTool(null);
    setSelectedTable(null);
    setTempMovePosition(null);
  };


  return (
    <RestaurantLayoutView
      rooms={rooms}
      width={width}
      height={height}
      canvasRef={canvasRef}
      setWidth={setWidth}
      setHeight={setHeight}

      currentTool={currentTool}
      wallSubTool={wallSubTool}
      tableSubTool={tableSubTool}
      selectedTableType={selectedTableType}
      roomSubTool={roomSubTool}
   
      isDrawingRoom={isDrawingRoom}

      handleRenameRoom={handleRenameRoom}
      handleDeleteRoom={handleDeleteRoom}

      handleToolSelect={handleToolSelect}
      handleTableSubToolSelect={handleTableSubToolSelect}
      handleWallSubToolSelect={handleWallSubToolSelect}
      //handleRoomSubToolSelect={handleRoomSubToolSelect}

      handleReset={handleReset}
      handleExport={handleExport}
      handleImport={handleImport}

      handleTableOptionClick={handleTableOptionClick}
      setSelectedTableType={setSelectedTableType}
      handleCanvasClick={handleCanvasClick}
      handleCanvasDoubleClick={handleCanvasDoubleClick}
      renderTableOptions={renderTableOptions}

    />
  );
};

export default RestaurantLayout;