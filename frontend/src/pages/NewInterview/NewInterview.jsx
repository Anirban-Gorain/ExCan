import React, { useReducer, useState } from "react";
import NavigationBar from "../../components/NavigationBar/NavigationBar";
import { FaPlus } from "react-icons/fa";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAudioStream } from "../../Redux/Slices/media";
import { setVideoStream } from "../../Redux/Slices/media";
import { setInterviewParameters } from "../../Redux/Slices/questionsAnswersAndInterviewInfo";
import { setQuestions } from "../../Redux/Slices/questionsAnswersAndInterviewInfo";
import axios from "axios";
import Spinner from "../../components/Spinner/Spinner";

const initialFormState = { jobRole: "", skills: "", experience: null };

function formReducer(state, action) {
  switch (action.type) {
    case "jobRole":
      return { ...state, jobRole: action.value };
    case "skills":
      return { ...state, skills: action.value };
    case "experience":
      return { ...state, experience: action.value };
  }
}

export default function NewInterview() {
  const [formState, dispatchForm] = useReducer(formReducer, initialFormState);
  const [displayError, setDisplayError] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);

  const handleClickOpen = () => {
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  function handleInput(type, value) {
    setDisplayError(false);
    dispatchForm({
      type,
      value,
    });
  }

  function handleForm() {
    if (
      formState.jobRole == "" ||
      formState.skills == "" ||
      formState.experience == null ||
      formState.experience == ""
    ) {
      setDisplayError(true);
      return false;
    }

    return true;
  }

  // Following function will handle Aud

  async function grantTheAudioPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return { permission: true, stream };
    } catch (error) {
      throw new Error({ message: error.name, from: "Aud" });
    }
  }

  // Following function will handle Vid

  async function grantTheVideoPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      return { permission: true, stream };
    } catch (error) {
      throw new Error({ message: error.name, from: "Vid" });
    }
  }

  // Fetching questions

  async function fetchInterviewQuestions() {
    setIsFetchingQuestions(true);

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-tiny",
        messages: [
          { role: "system", content: "You are an AI interviewer." },
          {
            role: "user",
            content: `Generate 10 interview questions for a ${formState.jobRole} with ${formState.experience} years of experience in ${formState.skills}`,
          },
        ],
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: "Bearer tSVtlD40nalC1iawzgfUxpw40vTRwEba",
          "Content-Type": "application/json",
        },
      }
    );

    let questions = response.data?.choices[0]?.message?.content
      .split("\n")
      .filter((question) => question != "")
      .map((question) => question?.split(" ")?.slice(1)?.join(" "));

    setIsFetchingQuestions(false);

    return questions;
  }

  // Handle start new interview function

  async function handleStart() {
    const ot = handleForm();

    if (!ot) return;

    const [videoResult, audioResult] = await Promise.allSettled([
      grantTheVideoPermission(),
      grantTheAudioPermission(),
    ]);

    if (
      audioResult.status === "fulfilled" &&
      videoResult.status === "fulfilled"
    ) {
      await dispatch(setAudioStream(audioResult.value.stream));
      await dispatch(setVideoStream(videoResult.value.stream));

      const questions = await fetchInterviewQuestions();

      console.log(questions);

      const { jobRole, skills, experience } = formState;

      dispatch(setInterviewParameters({ jobRole, skills, experience }));
      dispatch(setQuestions(questions));

      navigate(`/interview/new/${1234}`);
    } else {
      handleClickOpen(true);
    }
  }

  return (
    <>
      <NavigationBar />
      <div className="px-5 sm:px-40 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold">Start a new mock interview</h1>
        </div>

        <div className="w-full flex flex-wrap gap-x-8 gap-y-10 sm:gap-y-0 mb-10 border border-gray-200 rounded-md py-10 px-5">
          <div className="flex-grow">
            <div className="font-bold text-sm text-gray-600 mb-8">
              Enter your job role/position
            </div>

            <TextField
              onChange={(e) => handleInput(e.target.id, e.target.value)}
              id="jobRole"
              label="Position/role"
              fullWidth
            />
          </div>
          <div className="flex-grow">
            <div className="font-bold text-sm text-gray-600 mb-8">
              Enter your skills, separated by commas
            </div>

            <TextField
              id="skills"
              label="Skills"
              fullWidth
              onChange={(e) => handleInput(e.target.id, e.target.value)}
            />
          </div>
          <div className="flex-grow">
            <div className="font-bold text-sm text-gray-600 mb-8">
              Enter your experience
            </div>

            <TextField
              onChange={(e) => handleInput(e.target.id, e.target.value)}
              fullWidth
              id="experience"
              label="Experience"
              type="number"
              inputProps={{ min: 0 }}
            />
          </div>

          <div className="w-full mt-5">
            {displayError && (
              <div className="font-bold text-xs text-red-600">
                All the above fields role/position, skills and experience are
                mandatory
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col items-center">
          <h3 className="text-xs font-bold mb-5 italic text-left">
            The application requires your permission to access audio and video
          </h3>

          <Button
            className="border-2 border-green-600 h-[50px] rounded-xl flex justify-center items-center cursor-pointer bg-green-100 hover:bg-green-200 transition-all duration-200 w-[200px] shadow-md"
            onClick={handleStart}
            disabled={isFetchingQuestions}
          >
            <span className="flex items-center gap-2 text-lg font-semibold text-green-700">
              {isFetchingQuestions ? (
                <>
                  <Spinner size="5" color="green-600" />
                  <span className="text-sm">Loading...</span>
                </>
              ) : (
                <>
                  <FaPlus />
                  START NEW
                </>
              )}
            </span>
          </Button>
        </div>
      </div>

      <Dialog open={openDialog} onClose={handleClose}>
        <div className="p-6 bg-white rounded-lg text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Audio Access Required
          </h2>
          <p className="text-gray-600 mb-4">
            We need audio access to process your responses and provide feedback.
            This is required. Additionally video access is optional and will not
            be recorded or processed.
          </p>
          <Button
            sx={{
              backgroundColor: "#5bc136",
              color: "white",
            }}
            onClick={handleClose}
          >
            Close
          </Button>
        </div>
      </Dialog>
    </>
  );
}
