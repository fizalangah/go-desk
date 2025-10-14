"use client";
import { useState } from "react";

export default function ConnectSection() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");

  const handleConnect = async () => {
    try {
      const res = await fetch("http://localhost:5000/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      setStatus(data.message);
    } catch (error) {
      console.error(error);
      setStatus("Connection failed");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <input
        type="text"
        placeholder="Enter Friend's ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="border p-2 rounded-md"
      />
      <button
        onClick={handleConnect}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Connect
      </button>
      {status && <p className="mt-2 text-gray-700">{status}</p>}
    </div>
  );
}
