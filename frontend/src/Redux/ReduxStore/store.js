import { configureStore } from "@reduxjs/toolkit";
import mediaReducer from "../Slices/media";
import questionsAnswersAndInterviewInfoReducer from "../Slices/questionsAnswersAndInterviewInfo";

export const store = configureStore({
  reducer: {
    media: mediaReducer,
    questionsAnswersAndInterviewInfo: questionsAnswersAndInterviewInfoReducer,
  },
});
