// // app/page.tsx

// //import Image from 'next/image';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';

// export default function Home() {
//   return (
//     <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
//       <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-6">
//         <h1 className="text-3xl font-bold text-blue-400">Remote Connect</h1>
//         <p className="text-gray-300 text-sm">Securely share your screen or connect to another device</p>

//         <div className="space-y-4">
//           <div className="bg-gray-700 p-4 rounded-xl">
//             <h2 className="text-lg font-semibold mb-2">Your Access ID</h2>
//             <div className="text-2xl font-mono tracking-widest text-blue-400">843-192-554</div>
//             <p className="text-xs text-gray-400 mt-1">Share this ID with the person you want to connect with.</p>
//           </div>

//           <div className="bg-gray-700 p-4 rounded-xl space-y-3">
//             <h2 className="text-lg font-semibold mb-2">Connect to Partner</h2>
//             <input
//               type="text"
//               placeholder="Enter Partner ID"
//               className="w-full p-2 rounded-lg text-black outline-none focus:ring-2 focus:ring-blue-500"
//             />
           
//             <Link href="/viewer"><Button className="w-full bg-blue-600 hover:bg-blue-700 transition-all">Connect</Button></Link>
//           </div>
//         </div>

//         <div className="pt-4 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
//           <span>🔒 Secure Connection</span>
//           <span>v1.0</span>
//         </div>
//       </div>
//     </main>
//   );
// }

"use client";
import { useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";

const socket = io("http://localhost:5000");

export default function Home() {
  const [myId] = useState("843-192-554"); // for now static
  const [partnerId, setPartnerId] = useState("");
  const [status, setStatus] = useState("Not connected");

  // Identify yourself when connected
  socket.on("connect", () => {
    socket.emit("identify", myId);
    console.log("Connected to signaling server");
  });

  socket.on("connection-request", (data) => {
    alert(`Incoming connection request from ${data.fromId}`);
  });

  const handleConnect = () => {
    if (!partnerId) return alert("Please enter partner ID!");
    socket.emit("request-connection", { fromId: myId, toId: partnerId });
    setStatus(`Request sent to ${partnerId}`);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-6">
        <h1 className="text-3xl font-bold text-blue-400">Remote Connect</h1>
        <p className="text-gray-300 text-sm">Securely share your screen or connect to another device</p>

        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-xl">
            <h2 className="text-lg font-semibold mb-2">Your Access ID</h2>
            <div className="text-2xl font-mono tracking-widest text-blue-400">{myId}</div>
          </div>

          <div className="bg-gray-700 p-4 rounded-xl space-y-3">
            <h2 className="text-lg font-semibold mb-2">Connect to Partner</h2>
            <input
              type="text"
              placeholder="Enter Partner ID"
              className="w-full p-2 rounded-lg text-black outline-none focus:ring-2 focus:ring-blue-500"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            />
            <Button onClick={handleConnect} className="w-full bg-blue-600 hover:bg-blue-700 transition-all">
              Connect
            </Button>
            <p className="text-sm text-gray-400">{status}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
