import { useAuth } from "@/contexts/AuthContext";
import React from "react";

const ForbiddenPage = () => {
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-center h-screen">
      403 - Forbidden
      <button onClick={logout} className="ml-4 px-4 py-2 bg-primary text-on-primary rounded-lg">
        Go to Login
      </button>
    </div>
  );
};

export default ForbiddenPage;
