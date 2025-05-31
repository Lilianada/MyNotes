"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { User } from "firebase/auth";
import { LucideProps, CloudCog } from "lucide-react";
import { cn } from "@/lib/data-processing/utils"; // Make sure you have this utils function

// Google icon
const Google = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    {...props}
  >
    <path
      fill="currentColor"
      d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
    />
  </svg>
);

interface AuthDialogProps {
  trigger?: React.ReactNode;
  showDialog?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AuthDialog({
  trigger,
  showDialog,
  onOpenChange,
}: AuthDialogProps) {
  const [open, setOpen] = useState(!!showDialog);
  const { user, isAdmin, loading, signInWithGoogle, signOut } = useAuth();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  
  // Handle clicking outside to close
  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleOpenChange(false);
    }
  };
  
  // If dialog trigger is provided but not open, just render the trigger
  if (!open && trigger) {
    return <div onClick={() => handleOpenChange(true)}>{trigger}</div>;
  }
  
  // If dialog isn't open and no trigger is forced open, don't render
  if (!open && !showDialog) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={handleClickOutside} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
      <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="mb-4">
          <h2 className="text-lg font-bold">{user ? "Account" : "Sign In"}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {user
              ? isAdmin
                ? "You are signed in as an administrator."
                : "You are signed in, but are not an admin. Your notes are stored locally."
              : "Sign in to sync your notes across devices."}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 py-4">
          {user ? (
            <UserInfo user={user} isAdmin={isAdmin} />
          ) : (
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Google className="h-4 w-4" />
              Sign in with Google
            </Button>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          {user && (
            <Button variant="outline" onClick={signOut} disabled={loading}>
              Sign Out
            </Button>
          )}
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserInfo({ user, isAdmin }: { user: User; isAdmin: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-1 text-center">
        <p className="font-medium">{user.displayName}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="flex justify-center mt-2">
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              isAdmin
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isAdmin ? "Admin" : "Standard User"}
          </span>
        </div>
      </div>
    </div>
  );
}
