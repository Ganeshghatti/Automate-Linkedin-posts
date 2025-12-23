import fs from "fs";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { generateImage, generateImages } from "./imageGenerator.js";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0.7,
  apiKey: process.env.GEMINI_API_KEY,
});

// reference image for post creation
// function imageToMessage(filePath) {
//   const buffer = fs.readFileSync(filePath);
//   return {
//     type: "image_url",
//     image_url: {
//       url: `data:image/png;base64,${buffer.toString("base64")}`,
//     },
//   };
// }

// const baseSchema = (imageCount) =>
//   z.object({
//     post: z.string(),
//     // imagePrompts: z.array(z.string()).length(imageCount),
//   });

const postSchema = z.object({
  post: z.string(),
});

async function generatePostText(topic) {
  const structuredModel = model.withStructuredOutput(postSchema);
  const response = await structuredModel.invoke([
    new HumanMessage({
      content: [
        {
          type: "text",
          text: `You are a professional LinkedIn content writer.
          Topic: "${topic}"
          Guidelines:
            - Professional, engaging tone
            - 120–150 words
            - Use emojis sparingly
            - End with a soft CTA
            - Return ONLY valid JSON`,
        },
        // imageToMessage("media/1.png"),
        // imageToMessage("media/2.png"),
      ],
    }),
  ]);
  console.log("Hi response ",response)
  return response.post;
}

export async function generateSinglePost(topic) {
  const postText = await generatePostText(topic);
  console.log("POST TEXT:", postText);
  const imageBuffer = await generateImage(postText);
  const base64Image = imageBuffer.toString("base64");
  const imageUrl = `data:image/png;base64,${base64Image}`;
  return {
    post: postText,
    image: imageUrl,
  };
}

export async function generateCarouselPost(topic) {
  const base = await generateBaseContent(topic, 5);
  const images = await generateImages(base.imagePrompts);
  return {
    post: base.post,
    images, // Buffer[]
  };
}
