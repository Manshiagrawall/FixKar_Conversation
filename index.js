// const express = require('express');
// const multer = require('multer');
// const ffmpeg = require('fluent-ffmpeg');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const axios = require('axios');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Enable CORS
// app.use(cors());

// // Setup storage engine for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });

// // Your AssemblyAI API Key
//  // Replace with your AssemblyAI API key

// // Route to upload and convert M4A to MP3
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const uploadedFile = req.file;
//   if (!uploadedFile) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }

//   const outputFilePath = `uploads/${Date.now()}-converted.mp3`;

//   // Convert the uploaded M4A file to MP3 using FFmpeg
//   ffmpeg(uploadedFile.path)
//     .toFormat('mp3')
//     .on('end', async () => {
//       console.log('Conversion to MP3 completed');

//       // Remove the original M4A file after conversion
//       fs.unlink(uploadedFile.path, (err) => {
//         if (err) console.error('Error removing original file:', err);
//       });

//       // Upload the MP3 file to AssemblyAI for transcription
//       try {
//         const uploadResponse = await axios.post(
//           'https://api.assemblyai.com/v2/upload',
//           fs.createReadStream(outputFilePath),
//           {
//             headers: {
//               authorization: assemblyApiKey,
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         const audioUrl = uploadResponse.data.upload_url;

//         const transcriptResponse = await axios.post(
//           'https://api.assemblyai.com/v2/transcript',
//           {
//             audio_url: audioUrl,
//           },
//           {
//             headers: {
//               authorization: assemblyApiKey,
//             },
//           }
//         );

//         const transcriptId = transcriptResponse.data.id;

//         // Send back the transcript ID to the frontend
//         res.json({
//           success: true,
//           transcript_id: transcriptId,
//           mp3_url: `${req.protocol}://${req.get('host')}/${outputFilePath}`,
//         });
//       } catch (error) {
//         console.error('Error uploading to AssemblyAI:', error);
//         res.status(500).json({ error: 'Failed to upload to AssemblyAI' });
//       }
//     })
//     .on('error', (err) => {
//       console.error('Error during conversion:', err);
//       res.status(500).json({ error: 'Failed to convert file' });
//     })
//     .save(outputFilePath); // Save the output MP3 file to 'uploads'
// });

// // Serve static files from the 'uploads' directory
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// const express = require("express");
// const multer = require("multer");
// const ffmpeg = require("fluent-ffmpeg");
// const path = require("path");
// const fs = require("fs");
// const cors = require("cors");
// const Groq = require("groq-sdk");

// const app = express();
// const PORT = process.env.PORT || 5000;
// require("dotenv").config();

// // Enable CORS
// app.use(cors());

// // Setup storage engine for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });
// const groq = new Groq();
// const transcriptionModel = "distil-whisper-large-v3-en"; // Your transcription model
// const chatModel = "llama3-groq-70b-8192-tool-use-preview"; // Your chat model

// // Route to upload and convert audio to MP3
// app.post("/upload", upload.single("file"), async (req, res) => {
//   const uploadedFile = req.file;
//   if (!uploadedFile) {
//     console.error("No file uploaded");
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   console.log(`File uploaded: ${uploadedFile.path}`);

//   const outputFilePath = `uploads/${Date.now()}-converted.mp3`;

//   // Convert the uploaded audio file to MP3 using FFmpeg
//   ffmpeg(uploadedFile.path)
//     .toFormat("mp3")
//     .on("end", async () => {
//       console.log("Conversion to MP3 completed");

//       // Remove the original audio file after conversion
//       fs.unlink(uploadedFile.path, (err) => {
//         if (err) {
//           console.error("Error removing original file:", err);
//         } else {
//           console.log("Original audio file removed");
//         }
//       });

//       // Transcribe audio using the first Groq model
//       try {
//         console.log(`Transcribing audio file: ${outputFilePath}`);
//         const transcription = await groq.audio.transcriptions.create({
//           file: fs.createReadStream(outputFilePath),
//           model: transcriptionModel,
//           prompt: "",
//           response_format: "verbose_json",
//         });

//         console.log("Transcription successful:", transcription.text);

//         // Now send the transcription to the second Groq model
//         try {
//           console.log("Sending transcription to the second model...");
//           const chatCompletion = await groq.chat.completions.create({
//             messages: [
//               {
//                 role: "system",
//                 content: `You are an app navigator. Users will give you voice commands and you have to map them to actions. 

// There are only four actions available: Dashboard, Services, Chat, Profile
// If the query does not match any of these four keys, map it to None.

// Here are a few examples:

// User: I want to see the dashboard.
// Action: Dashboard

// User: Navigate me to the services page.
// Action: Services

// User: Take me to profile
// Action: Profile

// User: I need to talk to you
// Action: Chat
// Respond according to the data above
// If the user says things similar to above, respond accordingly`,
//               },
//               {
//                 role: "user",
//                 content: `User: ${transcription.text}\n Action:`,
//               },
//             ],
//             model: chatModel,
//             temperature: 0.5,
//             max_tokens: 1024,
//             top_p: 0.65,
//             stream: false, // Adjust as needed
//           });

//           console.log(
//             "Response from the second model:",
//             chatCompletion.choices[0]?.message?.content
//           );

//           // Send back the final response to the frontend
//           res.json({
//             success: true,
//             final_response: chatCompletion.choices[0]?.message?.content,
//             mp3_url: `${req.protocol}://${req.get("host")}/${outputFilePath}`,
//           });
//         } catch (error) {
//           console.error(
//             "Error processing text with the second Groq model:",
//             error
//           );
//           res
//             .status(500)
//             .json({ error: "Failed to process text with second model" });
//         }
//       } catch (error) {
//         console.error("Error transcribing audio with Groq:", error);
//         res.status(500).json({ error: "Failed to transcribe audio with Groq" });
//       }
//     })
//     .on("error", (err) => {
//       console.error("Error during conversion:", err);
//       res.status(500).json({ error: "Failed to convert file" });
//     })
//     .save(outputFilePath); // Save the output MP3 file to 'uploads'
// });

// // Serve static files from the 'uploads' directory
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });












// const express = require("express");
// const multer = require("multer");
// const ffmpeg = require("fluent-ffmpeg");
// const path = require("path");
// const fs = require("fs");
// const cors = require("cors");
// const Groq = require("groq-sdk");

// const app = express();
// const PORT = process.env.PORT || 5000;
// require("dotenv").config();

// // Enable CORS
// app.use(cors());

// // Setup storage engine for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });
// const groq = new Groq();
// const transcriptionModel = "distil-whisper-large-v3-en"; // Your transcription model
// const navigateModel = "llama3-groq-70b-8192-tool-use-preview"; // Navigate model
// const enterModel = "llama3-8b-8192"; // Enter model

// // Function to convert audio and process it through the transcription model
// async function processAudio(req, res, modelPrompt, chatModel) {
//   const uploadedFile = req.file;
//   if (!uploadedFile) {
//     console.error("No file uploaded");
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   console.log(`File uploaded: ${uploadedFile.path}`);
//   const outputFilePath = `uploads/${Date.now()}-converted.mp3`;

//   // Convert the uploaded audio file to MP3 using FFmpeg
//   ffmpeg(uploadedFile.path)
//     .toFormat("mp3")
//     .on("end", async () => {
//       console.log("Conversion to MP3 completed");

//       // Remove the original audio file after conversion
//       fs.unlink(uploadedFile.path, (err) => {
//         if (err) {
//           console.error("Error removing original file:", err);
//         } else {
//           console.log("Original audio file removed");
//         }
//       });

//       // Transcribe audio using Groq transcription model
//       try {
//         console.log(`Transcribing audio file: ${outputFilePath}`);
//         const transcription = await groq.audio.transcriptions.create({
//           file: fs.createReadStream(outputFilePath),
//           model: transcriptionModel,
//           prompt: "",
//           response_format: "verbose_json",
//         });

//         console.log("Transcription successful:", transcription.text);

//         // Send the transcription to the specified chat model
//         try {
//           console.log("Sending transcription to the chat model...");
//           const chatCompletion = await groq.chat.completions.create({
//             messages: [
//               {
//                 role: "system",
//                 content: modelPrompt,
//               },
//               {
//                 role: "user",
//                 content: `User: ${transcription.text}\n Action:`,
//               },
//             ],
//             model: chatModel,
//             temperature: 0.5,
//             max_tokens: 1024,
//             top_p: 0.65,
//             stream: false,
//           });

//           console.log(
//             "Response from the chat model:",
//             chatCompletion.choices[0]?.message?.content
//           );

//           // Send back the final response to the frontend+
//           res.json({
//             success: true,
//             final_response: chatCompletion.choices[0]?.message?.content,
//             mp3_url: `${req.protocol}://${req.get("host")}/${outputFilePath}`,
//           });
//         } catch (error) {
//           console.error("Error processing text with the chat model:", error);
//           res
//             .status(500)
//             .json({ error: "Failed to process text with the chat model" });
//         }
//       } catch (error) {
//         console.error("Error transcribing audio with Groq:", error);
//         res.status(500).json({ error: "Failed to transcribe audio with Groq" });
//       }
//     })
//     .on("error", (err) => {
//       console.error("Error during conversion:", err);
//       res.status(500).json({ error: "Failed to convert file" });
//     })
//     .save(outputFilePath);
// }

// // Route to upload and process audio for navigation actions
// app.post("/upload-navigate", upload.single("file"), (req, res) => {
//   const navigatePrompt = "You are an app navigator. Users will give you voice commands and you have to map them to actions. \n\nThere are only four actions available: Dashboard, Services, Chat, Profile\nIf the query does not match any of these four keys, map it to None.\n\nHere are a few examples:\n\nUser: I want to see the dashboard.\nAction: Dashboard\n\nUser: Navigate me to the services page.\nAction: Services\n\nUser: Take me to profile\nAction: Profile\n\nUser: I need to talk to you\nAction: Chat\nRespond according to the data above\nIf the user says things similar to above, respond accordingly\n";
//   processAudio(req, res, navigatePrompt, navigateModel);
// });

// // Route to upload and process audio for login/signup actions
// app.post("/upload-enter", upload.single("file"), (req, res) => {
//   const enterPrompt = "You are an app login signup helper. Users will give you commands and you have to map them to actions. \n\nThere are  actions available for login, signup and otp verification\nIf the query does not match any of these four keys, map it to None.\nUser: Greetings\naction: Hello, How can I help You\nUser: my name nishant and mobile number is 6261745714\naction: Your Name is nishant and Mobile Number is 6261745714\nUser: my mobile number is 6261745714\naction: you entered number 6261745714\nUser: my otp is 123456\naction: You entered OTP 123456\nUser: I want to log In\naction: Sure! I will help you with LogIn. Please provide your Ten digit mobile number.\nUser: I want to sign In\naction: OK! provide me your name and number for signup.\n\nIf the user says things similar to above, respond accordingly but do not add action as prefix.";
//   processAudio(req, res, enterPrompt, enterModel);
// });

// // Serve static files from the 'uploads' directory
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });





const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 5000;
require("dotenv").config();

// Enable CORS
app.use(cors());

// Setup storage engine for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const groq = new Groq();
const navigateModel = "llama3-groq-70b-8192-tool-use-preview"; // Navigate model
const enterModel = "llama3-8b-8192"; // Enter model

const assemblyAiApiKey = process.env.ASSEMBLYAI_API_KEY;

// Function to convert audio and process it through AssemblyAI
async function processAudio(req, res, modelPrompt, chatModel) {
  const uploadedFile = req.file;
  if (!uploadedFile) {
    console.error("No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log(`File uploaded: ${uploadedFile.path}`);
  const outputFilePath = `uploads/${Date.now()}-converted.mp3`;

  // Convert the uploaded audio file to MP3 using FFmpeg
  ffmpeg(uploadedFile.path)
    .toFormat("mp3")
    .on("end", async () => {
      console.log("Conversion to MP3 completed");

      // Remove the original audio file after conversion
      fs.unlink(uploadedFile.path, (err) => {
        if (err) {
          console.error("Error removing original file:", err);
        } else {
          console.log("Original audio file removed");
        }
      });

      // Transcribe audio using AssemblyAI
      try {
        console.log(`Uploading audio file to AssemblyAI: ${outputFilePath}`);
        const response = await axios.post(
          "https://api.assemblyai.com/v2/upload",
          fs.createReadStream(outputFilePath),
          {
            headers: {
              authorization: assemblyAiApiKey,
              "content-type": "application/octet-stream",
            },
          }
        );

        const uploadUrl = response.data.upload_url;

        console.log(`Audio file uploaded successfully. URL: ${uploadUrl}`);

        // Send the uploaded file URL to AssemblyAI for transcription
        const transcriptionResponse = await axios.post(
          "https://api.assemblyai.com/v2/transcript",
          {
            audio_url: uploadUrl,
          },
          {
            headers: {
              authorization: assemblyAiApiKey,
              "content-type": "application/json",
            },
          }
        );

        const transcriptId = transcriptionResponse.data.id;
        console.log(`Transcription request submitted. Transcript ID: ${transcriptId}`);

        // Poll for transcription completion
        let transcript;
        while (true) {
          const transcriptResult = await axios.get(
            `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
            {
              headers: { authorization: assemblyAiApiKey },
            }
          );

          transcript = transcriptResult.data;

          if (transcript.status === "completed") {
            console.log("Transcription successful:", transcript.text);
            break;
          } else if (transcript.status === "failed") {
            console.error("Transcription failed:", transcript.error);
            return res.status(500).json({ error: "Failed to transcribe audio" });
          } else {
            console.log("Transcription in progress, waiting...");
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
          }
        }

        // Send the transcription to the specified chat model
        try {
          console.log("Sending transcription to the chat model...");
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content: modelPrompt,
              },
              {
                role: "user",
                content: `User: ${transcript.text}\n Action:`,
              },
            ],
            model: chatModel,
            temperature: 0.5,
            max_tokens: 1024,
            top_p: 0.65,
            stream: false,
          });

          console.log(
            "Response from the chat model:",
            chatCompletion.choices[0]?.message?.content
          );

          // Send back the final response to the frontend
          res.json({
            success: true,
            final_response: chatCompletion.choices[0]?.message?.content,
            mp3_url: `${req.protocol}://${req.get("host")}/${outputFilePath}`,
          });
        } catch (error) {
          console.error("Error processing text with the chat model:", error);
          res
            .status(500)
            .json({ error: "Failed to process text with the chat model" });
        }
      } catch (error) {
        console.error("Error transcribing audio with AssemblyAI:", error);
        res.status(500).json({ error: "Failed to transcribe audio with AssemblyAI" });
      }
    })
    .on("error", (err) => {
      console.error("Error during conversion:", err);
      res.status(500).json({ error: "Failed to convert file" });
    })
    .save(outputFilePath);
}

// Route to upload and process audio for navigation actions
app.post("/upload-navigate", upload.single("file"), (req, res) => {
  const navigatePrompt = "You are an app navigator. Users will give you voice commands and you have to map them to actions. \n\nThere are only four actions available: Dashboard, Services, Chat, Profile\nIf the query does not match any of these four keys, map it to Sorry.\n\nHere are a few examples:\n\nUser: I want to see the dashboard.\nAction: Dashboard\n\nUser: Navigate me to the services page.\nAction: Services\n\nUser: Take me to profile\nAction: Profile\n\nUser: I need to talk to you\nAction: Chat\nRespond according to the data above\nIf the user says things similar to above, respond accordingly\n";
  processAudio(req, res, navigatePrompt, navigateModel);
});

// Route to upload and process audio for login/signup actions
app.post("/upload-enter", upload.single("file"), (req, res) => {
  const enterPrompt = "You are an app login signup helper. Users will give you commands and you have to map them to actions. \n\nThere are actions available for login, signup, and OTP verification\nIf the query does not match any of these, map it to Sorry.\nUser: Greetings\naction: Hello, How can I help You\nUser: my name is Nishant and mobile number is 6261745714\naction: Your Name is Nishant and Mobile Number is 6261745714\nUser: my mobile number is 6261745714\naction: you entered number 6261745714\nUser: my otp is 123456\naction: You entered OTP 123456\nUser: I want to log in\naction: Sure! I will help you with LogIn. Please provide your Ten digit mobile number.\nUser: I want to sign up\naction: OK! provide me your name and number for signup.\n\nIf the user says things similar to above, respond accordingly but do not add action as prefix.";
  processAudio(req, res, enterPrompt, enterModel);
});

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
