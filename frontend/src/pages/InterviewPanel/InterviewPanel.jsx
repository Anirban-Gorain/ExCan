import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAnswers } from "../../Redux/Slices/questionsAnswersAndInterviewInfo";
import AudioVisualizer from "../../components/AudioVisualizer/AudioVisualizer";

const InterviewPanel = () => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMalpractice, setIsMalpractice] = useState(!false);
  const [warningCount, setWarningCount] = useState(0);
  const [spokenAns, setSpokenAns] = useState("Start speaking...");
  const [isStartAnsweringEnabled, setIsStartAnsweringEnabled] = useState(true);
  const { videoStream } = useSelector((state) => state.media);
  const videoRef = useRef(null);
  const dispatch = useDispatch();
  const { questions, answers } = useSelector(
    (state) => state.questionsAnswersAndInterviewInfo
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Interview end handler

  const handleEndInterview = () => {
    setIsModalOpen(false);
    setIsInterviewEnded(true);
  };

  // grantSpeechRecognition

  const grantSpeechRecognition = useMemo(() => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error(
          "Speech Recognition API is not supported in this browser."
        );
        return null;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let fixedPart = "";
      let isStoppingManually = false;

      recognition.onstart = () => {
        setIsStartAnsweringEnabled(false);
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";

        console.log(event);

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            fixedPart += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setSpokenAns(fixedPart + interimTranscript);
      };

      recognition.onerror = (event) => {
        setIsStartAnsweringEnabled(true);
      };

      recognition.onend = () => {
        setIsStartAnsweringEnabled(true);
      };

      return {
        endSR: () => {
          isStoppingManually = true;
          recognition.stop();
          fixedPart = "";
          console.log("🚫 Stopped recognition.");
        },

        startSR: () => {
          recognition.start();
        },
      };
    } catch (error) {
      console.error("⚠️ Speech setup error:", error);
      return null;
    }
  }, []);

  // Quiz handler

  const handleNext = () => {
    if (!(questionIndex < questions.length - 1)) return;

    // Going to the next question
    setQuestionIndex(questionIndex + 1);

    // Storing the ans
    const newAnswerSet = [...answers, spokenAns];
    setAnswers(newAnswerSet);

    // Clearing "Your ans" section
    setSpokenAns("");

    // Stopping speech rec.
    grantSpeechRecognition.endSR();

    // Enabling start answering button
    setIsStartAnsweringEnabled(true);
  };

  const startSpeechRecHandler = () => {
    grantSpeechRecognition.startSR();
    setIsStartAnsweringEnabled(false);
  };

  // Media handlers

  useEffect(() => {
    videoRef.current.srcObject = videoStream;
    videoRef.current.play();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="w-full h-[100vh] px-6 py-4 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 items-start">
      {/* Left Panel */}
      <div className="flex flex-col gap-6 justify-around h-full">
        <div className="bg-white rounded-xl shadow px-4 py-5">
          <h2 className="text-lg font-semibold mb-2">
            Question {questionIndex + 1}
          </h2>
          <p className="bg-gray-100 px-3 py-2 rounded-md">
            {questions[questionIndex]}
          </p>
        </div>

        <div className="border p-4 rounded-lg bg-white ">
          <label className="font-semibold text-gray-700 mb-2 block">
            Your Answer
          </label>
          <div
            className="w-full p-2 border border-gray-300 rounded min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your answer here..."
          >
            {spokenAns}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-center">
          <button
            onClick={handleNext}
            disabled={questions.length === questionIndex + 1}
            className={`px-5 py-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2
            ${
              questions.length === questionIndex + 1
                ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg focus:ring-blue-400 active:shadow-none"
            }`}
          >
            Next
          </button>
          <button
            disabled={!isStartAnsweringEnabled}
            onClick={startSpeechRecHandler}
            className={`px-5 py-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2
            ${
              !isStartAnsweringEnabled
                ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg focus:ring-green-400 active:shadow-none"
            }`}
          >
            Start Answering
          </button>
          <button className="bg-red-600 text-white px-5 py-2 rounded-md transition-all duration-300 hover:bg-red-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 active:shadow-none">
            End Interview
          </button>

          <div className="w-full"></div>

          <span className="text-sm text-gray-500 flex items-center gap-1 w-full">
            ⏱ Total time taken: 06:51
          </span>
        </div>
      </div>

      {/* Right Panel - Video */}
      <div className="bg-white rounded-xl shadow px-4 py-5 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Video Processing
        </h3>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            className={`w-full h-full object-contain transition-all duration-300 ${
              isMalpractice
                ? "border-4 border-red-400"
                : "border-4 border-green-400"
            } rounded-xl`}
          />
          {isMalpractice && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow">
              Malpractice Detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPanel;
