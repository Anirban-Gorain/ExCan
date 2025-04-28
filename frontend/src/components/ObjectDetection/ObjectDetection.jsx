import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const movementThreshold = 15;
const prohibitedElectronicObjects = [
  "cell phone",
  "laptop",
  "tv",
  "remote",
  "keyboard",
  "mouse",
];
let shouldDetectProhibitedObjects = true;
let shouldCountPerson = true;
let shouldDetectMovement = true;

const useObjectDetection = (videoRef) => {
  const modelRef = useRef(null);
  const previousBoxRef = useRef(null);

  // Error handling state
  const [error, setError] = useState({
    hasError: false,
    errorMessage: "",
    errorObject: null,
  });

  const [warningCount, setWarningCount] = useState(0);
  const [personCount, setPersonCount] = useState(0);
  const [prohibitedObjectsDetected, setProhibitedObjectsDetected] = useState(
    []
  );
  const [isPersonMovingTooMuch, setIsPersonMovingTooMuch] = useState(false);

  // Ref to track if detection has started
  const isDetectionStarted = useRef(false);

  // Load the model
  useEffect(() => {
    const loadModel = async () => {
      try {
        modelRef.current = await cocoSsd.load();
        console.log("✅ Model loaded!");
      } catch (error) {
        console.error("❌ Error loading model:", error);
        setError({
          hasError: true,
          errorMessage: "Error loading the detection model.",
          errorObject: error,
        });
      }
    };

    loadModel();
  }, []);

  // Start method to trigger the detection process
  const start = () => {
    if (!videoRef.current || !modelRef.current) {
      setError({
        hasError: true,
        errorMessage: "Model or video reference is missing.",
        errorObject: null,
      });
      return;
    }

    if (isDetectionStarted.current) return; // Prevent starting detection multiple times

    isDetectionStarted.current = true;
    console.log("✅ Detection started!");
    detectFrame();
  };

  // Stop method to stop the detection process
  const stop = () => {
    isDetectionStarted.current = false;
    console.log("❌ Detection stopped!");
  };

  // Detect frame continuously
  const detectFrame = async () => {
    if (!videoRef.current || !modelRef.current || !isDetectionStarted.current)
      return;

    try {
      const predictions = await modelRef.current.detect(videoRef.current);
      processPredictions(predictions);
    } catch (error) {
      console.error("❌ Error detecting objects:", error);
      setError({
        hasError: true,
        errorMessage: "Error detecting objects in the video frame.",
        errorObject: error,
      });
    }

    requestAnimationFrame(detectFrame);
  };

  // Process predictions from the detection model
  const processPredictions = (predictions) => {
    let detectedProhibited = [];

    let count = 0;
    let personBox = null;

    predictions.forEach((pred) => {
      if (pred.class === "person" && pred.score > 0.6) {
        count++;
        personBox = pred.bbox;
        console.log("Detected person:", pred);
      }

      if (prohibitedElectronicObjects.includes(pred.class)) {
        detectedProhibited.push(pred.class);
      }
    });

    console.log(count);

    setPersonCount(() => count);

    if (shouldCountPerson && (count === 0 || count > 1)) {
      shouldCountPerson = false;

      setWarningCount((prev) => prev + 1);

      setTimeout(() => {
        shouldCountPerson = true;
      }, 5000);

      return;
    }

    if (shouldDetectProhibitedObjects && detectedProhibited.length > 0) {
      shouldDetectProhibitedObjects = false;

      setProhibitedObjectsDetected((prev) => [
        ...prev,
        ...new Set(detectedProhibited),
      ]);

      setWarningCount((prev) => prev + 1);

      setTimeout(() => {
        shouldDetectProhibitedObjects = true;
      }, 5000);

      detectedProhibited = [];

      return;
    }

    if (shouldDetectMovement && personBox) {
      const [x, y] = personBox;
      detectTooMuchMovement([x, y]);
    }
  };

  const detectTooMuchMovement = (currentBox) => {
    if (previousBoxRef.current && currentBox) {
      const dx = currentBox[0] - previousBoxRef.current[0];
      const dy = currentBox[1] - previousBoxRef.current[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > movementThreshold) {
        shouldDetectMovement = false;

        setIsPersonMovingTooMuch(true);
        setWarningCount((prev) => prev + 1);

        setTimeout(() => {
          shouldDetectMovement = true;
          setIsPersonMovingTooMuch(false);
        }, 5000);
      }
    }

    if (currentBox) {
      previousBoxRef.current = currentBox;
    }
  };

  return [
    personCount,
    prohibitedObjectsDetected,
    isPersonMovingTooMuch,
    warningCount,
    error, // Expose error state
    start, // Expose the start method
    stop, // Expose the stop method
  ];
};

export default useObjectDetection;
