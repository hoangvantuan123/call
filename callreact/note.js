import React, { useEffect, useState } from 'react';
import io from 'socket.io-client'; // You might need to install this package

const App = () => {
  const [userId, setUserId] = useState(null); // ID người dùng
  const [peers, setPeers] = useState({}); // Danh sách các kết nối ngang hàng

  const ROOM_ID = "<%= roomId %>";
  const socket = io('http://localhost:3000'); // Change the URL accordingly

  useEffect(() => {
    // Xác định và gửi ID người dùng đến máy chủ
    const randomUserId = Math.random().toString(36).substr(2, 9); // Tạo một ID ngẫu nhiên
    setUserId(randomUserId);
    socket.emit('join-room', ROOM_ID, randomUserId);

    // Lắng nghe sự kiện user-connected để thiết lập kết nối đến người dùng khác
    socket.on('user-connected', connectedUserId => {
      connectToNewUser(connectedUserId);
    });

    // Lắng nghe sự kiện user-disconnected để đóng kết nối khi người dùng rời khỏi
    socket.on('user-disconnected', disconnectedUserId => {
      if (peers[disconnectedUserId]) {
        peers[disconnectedUserId].close();
        const updatedPeers = { ...peers };
        delete updatedPeers[disconnectedUserId];
        setPeers(updatedPeers);
      }
    });

    // Gọi getUserMedia để truy cập video từ webcam
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        const myVideo = document.createElement('video');
        myVideo.muted = true;
        addVideoStream(myVideo, stream);

        // Lắng nghe sự kiện call để thiết lập kết nối khi có người gọi đến
        socket.on('call', call => {
          call.answer(stream);
          const video = document.createElement('video');
          call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
          });
        });

        // Gửi sự kiện user-connected khi đã truy cập được video
        socket.emit('user-connected', randomUserId);

        // Lắng nghe sự kiện khi người dùng rời khỏi
        window.addEventListener('beforeunload', () => {
          socket.emit('disconnect');
        });
      });
  }, []);

  const connectToNewUser = (userIdToConnect) => {
    // Tạo kết nối đến người dùng mới
    const call = peers[userIdToConnect].call(userIdToConnect);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
      video.remove();
    });
    setPeers({ ...peers, [userIdToConnect]: call });
  };

  const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    document.getElementById('video-grid').appendChild(video);
  };

  return (
    <div className="App">
      <div id="video-grid"></div>
    </div>
  );
}

export default App;
