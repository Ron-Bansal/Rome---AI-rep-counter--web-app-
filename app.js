const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");
const mpPose = window;

// Rep counter variables
counter_L = 0;
countdown_L = 100;
stage_L = null;

counter_R = 0;
countdown_R = 100;
stage_R = null;

function calculateAngle(a, b, c) {
  // console.log("OII");
  radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
  angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }
  // console.log("angle:", angle)
  return angle;
}

function repCountLogic(angle_L, angle_R) {
  //  Left arm
  if (angle_L < 50) {
    stage_L = "down";
    // console.log("L down state");
  }

  if (angle_L > 90 && stage_L === "down") {
    stage_L = "up";
    counter_L += 1;
    countdown_L -= 1;
    console.log("Reps (L)", counter_L);
  }

  // Right arm
  if (angle_R < 50) {
    stage_R = "down";
    // console.log("R down state");
  }

  if (angle_R > 90 && stage_R === "down") {
    stage_R = "up";
    counter_R += 1;
    countdown_R -= 1;
    console.log("Reps (R)", counter_R);
  }
}

function onResults(results) {
  if (!results.poseLandmarks) {
    // grid.updateLandmarks([]);
    return;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.segmentationMask,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  // Only overwrite existing pixels.
  canvasCtx.globalCompositeOperation = "source-in";
  canvasCtx.fillStyle = "rgba(0,0,0,0)";
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite missing pixels.
  canvasCtx.globalCompositeOperation = "destination-atop";
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  canvasCtx.globalCompositeOperation = "source-over";
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
    color: "#5079A5",
    lineWidth: 4,
  });
  drawLandmarks(canvasCtx, results.poseLandmarks, {
    color: "#304153",
    lineWidth: 0,
  });
  canvasCtx.restore();

  try {
    {
      landmarks = results.poseLandmarks;

      start_L_landmark_num = 23; // left hip
      mid_L_landmark_num = 11; // left shoulder
      end_L_landmark_num = 13; // left elbow

      start_R_landmark_num = 24; // right hip
      mid_R_landmark_num = 12; // right shoulder
      end_R_landmark_num = 14; // right elbow

      start_L = [
        landmarks[start_L_landmark_num].x,
        landmarks[start_L_landmark_num].y,
      ];
      mid_L = [
        landmarks[mid_L_landmark_num].x,
        landmarks[mid_L_landmark_num].y,
      ];
      end_L = [
        landmarks[end_L_landmark_num].x,
        landmarks[end_L_landmark_num].y,
      ];

      start_R = [
        landmarks[start_R_landmark_num].x,
        landmarks[start_R_landmark_num].y,
      ];
      mid_R = [
        landmarks[mid_R_landmark_num].x,
        landmarks[mid_R_landmark_num].y,
      ];
      end_R = [
        landmarks[end_R_landmark_num].x,
        landmarks[end_R_landmark_num].y,
      ];

      // console.log(start_L, start_R, mid_L, mid_R, end_L, end_R)

      // Calculate angle between landmark joints
      angle_L = calculateAngle(start_L, mid_L, end_L);
      angle_R = calculateAngle(start_R, mid_R, end_R);

    //   console.log("angleL =", angle_L);
    //   console.log("angleR =", angle_R);

      repCountLogic(angle_L, angle_R);
    }
  } catch (error) {
    console.log(error);
  }
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  },
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

pose.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});

camera.start();
