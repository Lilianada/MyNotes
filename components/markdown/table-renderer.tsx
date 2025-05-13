"use client"
import React from 'react';

interface TableRendererProps {
  rows: string[][];
}

/**
 * Component for rendering markdown tables
 */
const TableRenderer: React.FC<TableRendererProps> = ({ rows }) => {
  // Need at least one row for headers
  if (rows.length === 0) return null;
  
  return (
    <table className="min-w-full border border-gray-200 rounded-md my-4">
      <thead>
        <tr>
          {rows[0].map((header, i) => (
            <th 
              key={`header-${i}`}
              className="border border-gray-200 px-4 py-2 bg-gray-50 text-left font-medium text-gray-700"
              dangerouslySetInnerHTML={{ __html: header }}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(1).map((row, i) => (
          <tr key={`row-${i}`} className="hover:bg-gray-50 transition-colors">
            {row.map((cell, j) => (
              <td 
                key={`cell-${i}-${j}`}
                className="border border-gray-200 px-4 py-2"
                dangerouslySetInnerHTML={{ __html: cell }}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableRenderer;
