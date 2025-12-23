import axios from "axios";
import fs from "fs";

function imageToInlineData(filePath) {
  const buffer = fs.readFileSync(filePath);

  return {
    inlineData: {
      mimeType: "image/png",
      data: buffer.toString("base64"),
    },
  };
}

export async function generateImage(postText) {
  try {
    const modelId = "gemini-2.5-flash-image";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const visualPrompt = `
    Create a clean, professional LinkedIn-style image.
    IMPORTANT:
    - Follow ONLY the visual style of the reference images (colors, layout, typography)
    - Do NOT copy content from reference images
    - Keep design minimal and modern
    - Suitable for LinkedIn feed
    Post content:
    "${postText}"
    `;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              { text: visualPrompt },
              imageToInlineData("media/1.png"),
              imageToInlineData("media/2.png"),
              imageToInlineData("media/3.png"),
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const imagePart = response.data.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData
    );

    if (!imagePart) {
      throw new Error(
        "No image data returned. Prompt may have been blocked by safety filters."
      );
    }

    return Buffer.from(imagePart.inlineData.data, "base64");
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("Gemini REST Error:", errorMsg);
    throw error;
  }
}

export async function generateImages(prompts) {
  try {
    const imagePromises = prompts.map((prompt) => generateImage(prompt));
    return await Promise.all(imagePromises);
  } catch (error) {
    console.error("Batch generation failed:", error.message);
    throw error;
  }
}
