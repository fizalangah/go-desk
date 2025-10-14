"use client";
import React, { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

export default function ViewerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [partnerId, setPartnerId] = useState("");
  const [myId] = useState(() => "id-" + Math.random().toString(36).slice(2,9));
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("identify", myId);

    socket.on("request-error", (e: any) => alert(e.message));

    socket.on("offer", async (p: any) => {
      if (!pcRef.current) {
        pcRef.current = createPeerConnection(socket, p.fromId);
      }
      const pc = pcRef.current!;
      await pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { fromId: myId, toId: p.fromId, sdp: pc.localDescription });
    });

    socket.on("ice-candidate", async (p: any) => {
      try { await pcRef.current?.addIceCandidate(p.candidate); } catch {}
    });

    return () => { socket.off("offer"); socket.off("ice-candidate"); };
  }, [myId]);

  function createPeerConnection(socket: any, remoteId: string) {
    const pc = new RTCPeerConnection({
      iceServers: [
        /* add TURN servers here in production */
      ],
    });

    pc.ontrack = (evt) => {
      if (videoRef.current) videoRef.current.srcObject = evt.streams[0];
    };

    pc.ondatachannel = (e) => {
      dcRef.current = e.channel;
      dcRef.current.onmessage = (ev) => console.log("from target:", ev.data);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { fromId: myId, toId: remoteId, candidate: e.candidate });
    };

    return pc;
  }

  async function handleConnect() {
    if (!partnerId) return alert("Enter partner ID");
    const socket = getSocket();
    // tell server to forward connection request
    socket.emit("request-connection", { fromId: myId, toId: partnerId });
    alert("Request sent — waiting for target to accept.");
  }

  // sample: send simple click via data channel after connected
  function sendClick() {
    dcRef.current?.send(JSON.stringify({ type: "click", x: 100, y: 100 }));
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Viewer</h2>
      <div className="space-y-3 max-w-md">
        <input value={partnerId} onChange={(e)=>setPartnerId(e.target.value)} placeholder="Partner ID" className="w-full p-2 rounded text-black" />
        <button onClick={handleConnect} className="px-4 py-2 bg-blue-600 rounded text-white">Connect</button>
        <div>
          <video ref={videoRef} autoPlay playsInline className="w-full mt-3 bg-black rounded" />
        </div>
        <div>
          <button onClick={sendClick} className="mt-2 px-3 py-1 border rounded">Send Test Click</button>
        </div>
      </div>
    </div>
  );
}
