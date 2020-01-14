// Copyright (c) 2019 ml5 under MIT

// start loader screen
swal({
  title: "Loading...",
  text: "Please wait",
  icon: "./spinner.gif",
  button: false,
  closeOnClickOutside: false,
  closeOnEsc: false
});

let video;
let poseNet;
let poses = [];
let warnings = false;
let angles = [];
let plot = new Chart(
  document.getElementById('plot').getContext('2d'),
  {
  type: 'line',
  data: {
    datasets: [
      {
        label: "Left Elbow",
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: 'green',
        data: []
      }
    ]
  },
  options: {
    scales: {
      xAxes: [{
        type: 'linear',
        position: 'bottom'
      }]
    }
  }
});

function setup() {
  let canvas = createCanvas(windowHeight * 2 / 3, windowHeight / 2);
  let x = (windowWidth - width) / 2;
  let y = 10;
  canvas.position(x, y);
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(
    video,
    {
      imageScaleFactor: 0.3,
      outputStride: 16,
      flipHorizontal: false,
      minConfidence: 0.5,
      scoreThreshold: 0.5,
      nmsRadius: 20,
      detectionType: 'single',
      multiplier: 0.75,
    },
    modelReady
  );
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function (results) {
    // initialize module variables
    poses = results;
    warnings = false;

    if (poses.length > 0) {
      const pose = poses[0].pose;
      if (pose.score >= 0.2) {
        const points = pose.keypoints;
        function getPart(partName) {
          const part = points.filter((point) => point.part === partName)[0]
          if (part.score < 0.1) {
            warnings = true;
          } else {
            return part.position;
          }
        }
        const [
          leftShoulder,
          rightShoulder,
          leftElbow,
          rightElbow,
          leftWrist,
          rightWrist,
          leftHip,
          rightHip,
          leftKnee,
          rightKnee,
          leftAnkle,
          rightAnkle
        ] = [
          "leftShoulder",
          "rightShoulder",
          "leftElbow",
          "rightElbow",
          "leftWrist",
          "rightWrist",
          "leftHip",
          "rightHip",
          "leftKnee",
          "rightKnee",
          "leftAnkle",
          "rightAnkle"
        ].map(getPart);
        if (!warnings) {
          angles.push(
            {
              leftElbow: getAngle(leftShoulder, leftElbow, leftWrist),
              rightElbow: getAngle(rightShoulder, rightElbow, rightWrist),
              leftKnee: getAngle(leftHip, leftKnee, leftAnkle),
              rightKnee: getAngle(rightHip, rightKnee, rightAnkle),
            }
          );
          addAnglesToPlot();
        }
      }
    }
  });

  // Hide the video element, and just show the canvas
  video.hide();
}

function getAngle(p1, p2, p3) {
  let alpha = toDegrees(Math.atan(Math.abs((p2.y - p1.y) / (p2.x - p1.x))));
  let beta = toDegrees(Math.atan(Math.abs((p3.y - p2.y) / (p3.x - p2.x))));
  return alpha + beta
}

function toDegrees(radians) {
  var pi = Math.PI;
  return radians * (180 / pi);
}

function modelReady() {
  swal.close();
}

function draw() {
  image(video, 0, 0, width, height);

  if (!warnings) {
    drawKeypoints();
    drawSkeleton();
  } else {
    swal("Please make sure that all your body parts are in the view of the camera.", {
      icon: "warning",
      buttons: false,
      timer: 200,
    });
  }
}

function addAnglesToPlot() {
  const newAngles = angles[angles.length - 1];
  let timeIndex = plot.data.datasets[0].data.length;
  plot.data.datasets[0].data.push({x : timeIndex, y : newAngles.leftElbow });
  plot.update();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}