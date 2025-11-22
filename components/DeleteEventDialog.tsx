"use client";

import { useState, useEffect } from "react";

interface DeleteEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteFutureEvents: boolean) => void;
  eventTitle: string;
  eventDate: Date;
  isPending?: boolean;
}

export function DeleteEventDialog({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  eventDate,
  isPending = false,
}: DeleteEventDialogProps) {
  const [deleteFutureEvents, setDeleteFutureEvents] = useState(false);

  // Add/remove body class to control z-index of other elements
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(deleteFutureEvents);
    setDeleteFutureEvents(false);
  };

  const handleCancel = () => {
    setDeleteFutureEvents(false);
    onClose();
  };

  return (
    <>
      {/* Gradient mask backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Delete Event
          </h3>
          
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete <strong>{eventTitle}</strong> on{" "}
            <strong>{eventDate.toLocaleDateString()}</strong>?
          </p>

          <div className="mb-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="deleteFutureEvents"
                checked={deleteFutureEvents}
                onChange={(e) => setDeleteFutureEvents(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label
                htmlFor="deleteFutureEvents"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Also delete all future recurring events with the same title, time,
                and meeting point
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

