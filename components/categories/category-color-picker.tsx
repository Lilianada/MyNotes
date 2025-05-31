"use client";

import React from 'react';

interface CategoryColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  size?: 'small' | 'medium';
}

export const COLOR_OPTIONS = [
  { name: 'Red', value: '#f87171' },
  { name: 'Orange', value: '#fb923c' },
  { name: 'Yellow', value: '#facc15' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Blue', value: '#60a5fa' },
  { name: 'Purple', value: '#a78bfa' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Gray', value: '#9ca3af' },
  { name: 'Teal', value: '#2dd4bf' },
  { name: 'Indigo', value: '#818cf8' },
  { name: 'Rose', value: '#fb7185' },
  { name: 'Amber', value: '#fbbf24' },
  { name: 'Lime', value: '#a3e635' },
];

export function CategoryColorPicker({ 
  selectedColor, 
  onColorChange, 
  size = 'medium' 
}: CategoryColorPickerProps) {
  const colorSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className="flex flex-wrap gap-1">
      {COLOR_OPTIONS.map(color => (
        <button
          key={color.value}
          type="button"
          onClick={() => onColorChange(color.value)}
          className={`${colorSize} rounded-full ${
            selectedColor === color.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''
          }`}
          style={{ backgroundColor: color.value }}
          title={color.name}
        />
      ))}
    </div>
  );
}
