import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function imageToInlineData(filePath) {
  const buffer = fs.readFileSync(filePath);

  return {
    inlineData: {
      mimeType: "image/jpeg",
      data: buffer.toString("base64"),
    },
  };
}

export async function generateImage(
  slideContext,
  aspectRatio = "16:9",
  imageSize = "2K"
) {
  try {
    // const visualPrompt = `
    // Create a clean, professional LinkedIn-style image.
    // BRAND & STYLE CONSTRAINTS (MUST FOLLOW):
    // - Color palette ONLY:
    //   - Dark: #0a0603
    //   - White: #ffffff
    //   - Light gray: #f6f6f6
    //   - Accent orange: #ff5733
    // - Typography style: Geist-style modern sans-serif
    //   - Clean, geometric, minimal
    //   - Medium to semi-bold headings
    //   - High readability
    // - Background style:
    //   - Abstract soft gradient shapes
    //   - Smooth blurred color transitions
    //   - No sharp patterns or noise
    //   - Similar to the provided reference images

    // DESIGN RULES:
    //   - Use reference images ONLY for visual style
    //   - Do NOT copy layout or text from reference images
    //   - Minimal, modern, premium look
    //   - Suitable for LinkedIn feed
    //   - No logos, no watermarks
    //   - No excessive text on image

    // POST CONTENT (for context only):
    // "${postText}"
    // `;

    const visualPrompt = `
ROLE:
You are a professional visual designer creating a high-quality LinkedIn post image.

TOPIC:
"${slideContext}"

DESIGN STYLE AND LAYOUT:
- Use reference images ONLY for visual style
- Do NOT copy layout or text from reference images
- Minimal, modern, premium look
- Suitable for LinkedIn feed
- No logos, no watermarks
- No excessive text on image


COLOR PALETTE:
- Dark: #0a0603
- White: #ffffff
- Light gray: #f6f6f6
- Accent orange: #ff5733
`;

console.log("visualPrompt ", visualPrompt);

    const contents = [
      visualPrompt,
      imageToInlineData("media/1.jpeg"),
      imageToInlineData("media/2.jpeg"),
      imageToInlineData("media/3.jpeg")
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData
    );

    if (!imagePart) {
      throw new Error(
        "No image data returned. Prompt may have been blocked by safety filters."
      );
    }

    return Buffer.from(imagePart.inlineData.data, "base64");
  } catch (error) {
    const errorMsg = error.message || "Unknown error occurred";
    console.error("Gemini SDK Error:", errorMsg);
    throw error;
  }
}

export async function generateImages(
  postText,
  slideContexts,
  aspectRatio = "16:9",
  imageSize = "2K"
) {
  try {
    const imagePromises = slideContexts.map((context) =>
      generateImage(postText, context, aspectRatio, imageSize)
    );
    return await Promise.all(imagePromises);
  } catch (error) {
    console.error("Batch generation failed:", error.message);
    throw error;
  }
}
