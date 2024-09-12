import React, { useState } from 'react';
import { Room } from '../types';

interface RoomListProps {
  rooms: Room[];
  onDeleteRoom: (roomId: number) => void;
  onRenameRoom: (roomId: number, newName: string) => void;
  level?: number;
}

export const RoomList: React.FC<RoomListProps> = ({ rooms, onDeleteRoom, onRenameRoom, level = 0 }) => {
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
                <button onClick={() => handleRename(room)}>Rename</button>
                <button onClick={() => onDeleteRoom(room.id)}>Delete</button>
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