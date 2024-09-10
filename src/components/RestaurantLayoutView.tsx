import React from 'react';
import { RoomList } from './RestaurantLayout'; 
import { Room, TableType, Tool, TableSubTool } from '../types';

interface RestaurantLayoutViewProps {
  rooms: Room[];
  width: number;
  height: number;
  currentTool: string | null;
  tableSubTool: TableSubTool;
  isDrawingRoom: boolean;
  isAddingTable: boolean;
  selectedTableType: TableType;

  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  handleRenameRoom: (roomId: number, newName: string) => void;
  handleDeleteRoom: (roomId: number) => void;

  handleToolSelect: (tool: 'wall' | 'eraser' | 'table' | 'room') => void;
  handleTableSubToolSelect: (subTool: TableSubTool) => void;

  handleReset: () => void;
  handleExport: () => void;
  handleImport: () => void;

  handleTableOptionClick: (event: React.MouseEvent<HTMLImageElement>) => void;
  setSelectedTableType: (type: TableType) => void;
  handleCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  handleCanvasDoubleClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  renderTableOptions: () => HTMLCanvasElement;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const buttonStyle: React.CSSProperties = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

export const RestaurantLayoutView: React.FC<RestaurantLayoutViewProps> = ({
  rooms,
  width,
  height,
  currentTool,
  isDrawingRoom,
  isAddingTable,
  selectedTableType,
  setWidth,
  setHeight,
  handleRenameRoom,
  handleDeleteRoom,
  handleToolSelect,
  handleReset,
  handleExport,
  handleImport,
  
  handleTableOptionClick,
  setSelectedTableType,

  handleCanvasClick,
  handleCanvasDoubleClick,
  renderTableOptions,
  
  tableSubTool,
  handleTableSubToolSelect,
  canvasRef
}) => {
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
        <button 
        onClick={() => handleTableSubToolSelect('add')}
        style={{ 
          ...buttonStyle,
          backgroundColor: tableSubTool === 'add' ? 'lightblue' : 'white' 
        }}
      >
        Add</button>
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
      <button 
        onClick={() => handleTableSubToolSelect('delete')}
        style={{ 
          ...buttonStyle,
          backgroundColor: tableSubTool === 'delete' ? 'lightblue' : 'white' 
        }}
      >Delete</button>
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