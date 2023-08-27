import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';

const App = () => {
  const videoGrid = useRef(null);
  const myVideo = useRef(null);
  const myPeer = useRef(null);
  const peers = useRef({});
  const [numUsers, setNumUsers] = useState(0);
  const [cameraIds, setCameraIds] = useState({});
  const userId = 'your-user-id'; // Thay bằng ID người dùng khi đăng nhập

  useEffect(() => {
    const socket = io('http://localhost:5000');

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        myPeer.current = new Peer(userId, {
          host: '/',
          port: '5001'
        });

        addVideoStream(myVideo.current, stream, userId);

        myPeer.current.on('call', call => {
          call.answer(stream);
          const video = document.createElement('video');
          call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream, call.peer);
          });
        });

        socket.on('user-connected', remoteUserId => {
          connectToNewUser(remoteUserId, stream);
        });

        socket.on('user-disconnected', remoteUserId => {
          if (peers.current[remoteUserId]) peers.current[remoteUserId].close();
          setNumUsers(prevNumUsers => Math.max(0, prevNumUsers - 1));
          setCameraIds(prevCameraIds => {
            const updatedIds = { ...prevCameraIds };
            delete updatedIds[remoteUserId];
            return updatedIds;
          });
        });

        myPeer.current.on('open', id => {
          socket.emit('join-room', 'ROOM_ID', userId);
        });
      });
  }, []);

  function connectToNewUser(remoteUserId, stream) {
    const call = myPeer.current.call(remoteUserId, stream);
    peers.current[remoteUserId] = call;
    setNumUsers(prevNumUsers => prevNumUsers + 1);
    setCameraIds(prevCameraIds => ({
      ...prevCameraIds,
      [remoteUserId]: remoteUserId,
    }));

    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream, remoteUserId);
    });
    call.on('close', () => {
      video.remove();
      delete peers.current[remoteUserId];
      setNumUsers(prevNumUsers => prevNumUsers - 1);
      setCameraIds(prevCameraIds => {
        const updatedIds = { ...prevCameraIds };
        delete updatedIds[remoteUserId];
        return updatedIds;
      });
    });
  }

  function addVideoStream(video, stream, remoteUserId) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.current.append(video);
  }

  return (
    <div>
      <div>
        <p>Number of users: {numUsers}</p>
        <ul>
          {Object.entries(cameraIds).map(([remoteUserId, cameraId]) => (
            <li key={remoteUserId}>Camera ID for user {remoteUserId}: {cameraId}</li>
          ))}
        </ul>
      </div>
      <div ref={videoGrid}></div>
      <video ref={myVideo} muted autoPlay></video>
    </div>
  );
};

export default App;
