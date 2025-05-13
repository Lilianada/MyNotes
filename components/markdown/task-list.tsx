"use client"
import React, { useCallback } from 'react';

interface TaskListProps {
  items: Array<{
    content: string;
    checked: boolean;
    label: string;
  }>;
  onChange?: (index: number, checked: boolean) => void;
}

/**
 * Component for rendering task list items with checkboxes
 */
const TaskList: React.FC<TaskListProps> = ({ items, onChange }) => {
  const handleChange = useCallback((index: number, checked: boolean) => {
    if (onChange) {
      onChange(index, checked);
    }
  }, [onChange]);
  
  return (
    <ul className="pl-6 my-2 list-disc">
      {items.map((item, index) => (
        <li key={`task-${index}`} className="my-1">
          <div className="flex items-start">
            <input 
              type="checkbox" 
              className="mt-1 mr-2 h-4 w-4 task-checkbox rounded-sm bg-white border border-gray-300" 
              checked={item.checked} 
              onChange={(e) => handleChange(index, e.target.checked)}
            />
            <span 
              className={item.checked ? "line-through text-gray-500" : ""}
              dangerouslySetInnerHTML={{ __html: item.content }} 
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TaskList;
