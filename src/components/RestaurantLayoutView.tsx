import React from 'react';
import { RoomList } from './RoomList'; 
import { Room, TableType, Tool, TableSubTool, WallSubTool, RoomSubTool } from '../types';

interface RestaurantLayoutViewProps {
  rooms: Room[];
  width: number;
  height: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;

  currentTool: string | null;
  wallSubTool: WallSubTool;
  tableSubTool: TableSubTool;
  selectedTableType: TableType;
  roomSubTool: RoomSubTool;

  isDrawingRoom: boolean;

  handleRenameRoom: (roomId: number, newName: string) => void;
  handleDeleteRoom: (roomId: number) => void;

  handleToolSelect: (tool: Tool) => void;
  handleTableSubToolSelect: (subTool: TableSubTool) => void;
  handleWallSubToolSelect: (subTool: WallSubTool) => void;
  //handleRoomSubToolSelect: (subTool: RoomSubTool) => void;

  handleReset: () => void;
  handleExport: () => void;
  handleImport: () => void;

  handleTableOptionClick: (event: React.MouseEvent<HTMLImageElement>) => void;
  setSelectedTableType: (type: TableType) => void;
  handleCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  handleCanvasDoubleClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  renderTableOptions: () => HTMLCanvasElement;

}

const buttonStyle: React.CSSProperties = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  padding: '20px',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

export const RestaurantLayoutView: React.FC<RestaurantLayoutViewProps> = ({
  rooms,
  width,
  height,
  canvasRef,
  setWidth,
  setHeight,

  currentTool,
  wallSubTool,
  tableSubTool,
  selectedTableType,
  roomSubTool,

  isDrawingRoom,

  handleRenameRoom,
  handleDeleteRoom,

  handleToolSelect,
  handleTableSubToolSelect,
  handleWallSubToolSelect,
  //handleRoomSubToolSelect,

  handleReset,
  handleExport,
  handleImport,
  
  handleTableOptionClick,
  setSelectedTableType,

  handleCanvasClick,
  handleCanvasDoubleClick,
  renderTableOptions
  
}) => {
  return (
    <div style={containerStyle}>
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
      {currentTool === 'wall' && (
        <div>
          <button 
            onClick={() => handleWallSubToolSelect('add')}
            style={{ 
              ...buttonStyle,
              backgroundColor: wallSubTool === 'add' ? 'lightblue' : 'white' 
            }}
          >
            Add
          </button>
          <button 
            onClick={() => handleWallSubToolSelect('delete')}
            style={{ 
              ...buttonStyle,
              backgroundColor: wallSubTool === 'delete' ? 'lightblue' : 'white' 
            }}
          >
            Delete
          </button>
        </div>
      )}
      {currentTool === 'table' && (
    <div>
        <div>
        <button 
        onClick={() => handleTableSubToolSelect('add')}
        style={{ 
          ...buttonStyle,
          backgroundColor: tableSubTool === 'add' ? 'lightblue' : 'white' 
        }}
      >
        Add
      </button>
      <button 
        onClick={() => handleTableSubToolSelect('delete')}
        style={{ 
          ...buttonStyle,
          backgroundColor: tableSubTool === 'delete' ? 'lightblue' : 'white' 
        }}
      >
        Delete
      </button>
      <button 
        onClick={() => handleTableSubToolSelect('move')}
        style={{ 
          ...buttonStyle,
          backgroundColor: tableSubTool === 'move' ? 'lightblue' : 'white' 
        }}
      >
        Move
      </button>
      <button 
        onClick={() => handleTableSubToolSelect('merge')}
        style={{ 
          ...buttonStyle,
          backgroundColor: tableSubTool === 'merge' ? 'lightblue' : 'white' 
        }}
      >
        Merge
      </button>
      <button 
        onClick={() => handleTableSubToolSelect('editChairs')}
        style={{ 
          ...buttonStyle,
          backgroundColor: tableSubTool === 'editChairs' ? 'lightblue' : 'white' 
        }}
      >
        Edit Chairs
      </button>
    </div>
    {tableSubTool === 'add' && (
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