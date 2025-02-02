'use client'
import { useEffect, useRef, useState } from "react";

const CameraBlueScreen = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [blueDetected, setBlueDetected] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Access webcam
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } }) // Use rear camera if available
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => console.error("Error accessing webcam:", err));

    const ctx = canvas.getContext("2d");

    const processFrame = () => {
      if (!ctx || !video) return;

      const w = canvas.width;
      const h = canvas.height;

      //scaled down processing resolution (revisit)
      ctx.drawImage(video, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;

      let bluePixelCount = 0;
      const totalPixels = w * h;

      //skip pixels for efficienct
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        //blue detection threshold
        const isBlue = b > 100 && b > r * 1.2 && b > g * 1.1;

        if (!isBlue) {
          //make non blue pixels black
          pixels[i] = 0;
          pixels[i + 1] = 0;
          pixels[i + 2] = 0;
        } else {
          bluePixelCount++;
        }
      }

      setBlueDetected(bluePixelCount > totalPixels * 0.01);

      //expand blue for edge enhancement
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 255) {
          //check nearby pixels for black
          const neighbors = [
            pixels[i - 4] === 255, //l
            pixels[i + 4] === 255, //r
            pixels[i - w * 4] === 255, //u
            pixels[i + w * 4] === 255, //d
          ];

          if (neighbors.some((n) => n)) {
            pixels[i] = 50; //expand blue
            pixels[i + 1] = 50;
            pixels[i + 2] = 255;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(processFrame);
    };

    video.addEventListener("play", processFrame);
  }, []);

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black">
      <video ref={videoRef} className="hidden" playsInline />
      <canvas ref={canvasRef} className="w-full h-full" />
      {blueDetected && (
        <div className="absolute top-10 text-3xl text-white font-bold bg-blue-500 px-4 py-2 rounded-lg">
          Blue Detected
        </div>
      )}s
    </div>
  );
};

export default CameraBlueScreen;
