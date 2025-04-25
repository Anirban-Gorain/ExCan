import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  audioStream: null,
  videoStream: null,
};

export const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {
    setAudioStream: (state, action) => {
      if (!action.payload) console.log("Audio stream is already been set");

      state.audioStream = action.payload;
    },

    setVideoStream: (state, action) => {
      if (!action.payload) console.log("Video stream is already been set");

      state.videoStream = action.payload;
    },
  },
});

export const { setAudioStream, setVideoStream } = mediaSlice.actions;

export default mediaSlice.reducer;
