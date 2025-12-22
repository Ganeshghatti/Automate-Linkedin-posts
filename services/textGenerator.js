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
function imageToMessage(filePath) {
  const buffer = fs.readFileSync(filePath);
  return {
    type: "image_url",
    image_url: {
      url: `data:image/png;base64,${buffer.toString("base64")}`,
    },
  };
}

const baseSchema = (imageCount) =>
  z.object({
    post: z.string(),
    imagePrompts: z.array(z.string()).length(imageCount),
  });

async function generateBaseContent(topic, imageCount) {
  const structuredModel = model.withStructuredOutput(baseSchema(imageCount));
  const response = await structuredModel.invoke([
    new HumanMessage({
      content: [
        {
          type: "text",
          text: `You are a professional LinkedIn content creator and visual designer.
          Topic: "${topic}"
          Use the uploaded images ONLY as visual style reference (colors, layout, typography, tone).
          Rules:
            - Return ONLY valid JSON
            - No markdown
            - No explanation
            - Image prompts must be detailed and suitable for AI image generation`,
        },
        imageToMessage("media/1.png"),
        imageToMessage("media/2.png"),
      ],
    }),
  ]);
  return response;
}

export async function generateSinglePost(topic) {
  const base = await generateBaseContent(topic, 1);
  const imageBuffer = await generateImage(base.imagePrompts[0]);
  const base64Image = imageBuffer.toString("base64");
  const imageUrl = `data:image/png;base64,${base64Image}`;
  return {
    post: base.post,
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
