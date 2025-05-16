"use client"

import React from "react"

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
}

export function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: DeleteConfirmationProps) {
  // If the modal isn't open, don't render anything
  if (!isOpen) return null;
  
  // Handle clicking outside to close
  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use a portal root element at the document level to ensure overlay covers everything
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={handleClickOutside} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
      <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md font-mono" onClick={e => e.stopPropagation()}>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-red-600">{title}</h2>
          <p className="text-sm text-gray-700 mt-2">{description}</p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 border border-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmation
