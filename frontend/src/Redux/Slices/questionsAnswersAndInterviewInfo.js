import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  questions: null,
  answers: [],
  jobRole: null,
  skills: null,
  experience: null,
};

export const questionsAnswersAndInterviewInfo = createSlice({
  name: "questionsAnswersAndInterviewInfo",
  initialState,
  reducers: {
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },

    setAnswers: (state, action) => {
      state.answers = action.payload;
    },

    setInterviewParameters: (state, action) => {
      const { jobRole, skills, experience } = action.payload;
      state.jobRole = jobRole;
      state.skills = skills;
      state.experience = experience;
    },
  },
});

export const { setQuestions, setAnswers, setInterviewParameters } =
  questionsAnswersAndInterviewInfo.actions;

export default questionsAnswersAndInterviewInfo.reducer;
