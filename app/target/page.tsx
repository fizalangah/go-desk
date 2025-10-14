"use client";
import React, { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

export default function TargetPage() {
  const [myId] = useState(() => "id-" + Math.random().toString(36).slice(2,9));
  const [incoming, setIncoming] = useState<{ fromId: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("identify", myId);

    socket.on("connection-request", (p: any) => {
      setIncoming(p);
    });

    socket.on("answer", async (p: any) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(p.sdp));
      }
    });

    socket.on("ice-candidate", async (p: any) => {
      try { await pcRef.current?.addIceCandidate(p.candidate); } catch {}
    });

    return () => { socket.off("connection-request"); socket.off("answer"); socket.off("ice-candidate"); };
  }, [myId]);

  async function acceptRequest(fromId: string) {
    const socket = getSocket();
    const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
    if (videoRef.current) videoRef.current.srcObject = stream;

    const pc = new RTCPeerConnection({ iceServers: [] });
    pcRef.current = pc;

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    // create data channel handler for incoming inputs (viewer might create channel)
    pc.ondatachannel = (e) => {
      const dc = e.channel;
      dc.onmessage = (ev) => {
        const evt = JSON.parse(ev.data);
        handleRemoteEvent(evt);
      };
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { fromId: myId, toId: fromId, candidate: e.candidate });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { fromId: myId, toId: fromId, sdp: pc.localDescription });

    setIncoming(null);
  }

  function handleRemoteEvent(evt: any) {
    // For browser-only: you can replay events in page DOM (not OS-wide)
    if (evt.type === "click") {
      console.log("Remote requested click at", evt.x, evt.y);
      // implement DOM-based replay if your page is controllable
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Target</h2>
      <div>
        <p>Your ID: <span className="font-mono">{myId}</span></p>
      </div>
      <video ref={videoRef} autoPlay playsInline className="w-full mt-3 bg-black rounded" />
      {incoming && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow">
            <p className="mb-4">Incoming request from <b>{incoming.fromId}</b></p>
            <div className="flex gap-2">
              <button onClick={() => acceptRequest(incoming.fromId)} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>
              <button onClick={() => setIncoming(null)} className="px-3 py-1 border rounded">Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
