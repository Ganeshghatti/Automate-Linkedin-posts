// import axios from "axios";

// export async function generateImage(prompt) {
//   try {
//     const response = await axios.post(
//       "https://api.openai.com/v1/images/generations",
//       {
//         model: "gpt-image-1",
//         prompt,
//         size: "1024x1024",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const base64Image = response.data.data[0].b64_json;

//     const imageBuffer = Buffer.from(base64Image, "base64");

//     return imageBuffer;
//   } catch (error) {
//     console.error("Error generating image:", error.response?.data || error.message);
//     throw error;
//   }
// }

// export async function generateImages(prompts) {
//   const images = [];

//   for (const prompt of prompts) {
//     const image = await generateImage(prompt);
//     images.push(image);
//   }

//   return images;
// }

import axios from "axios";

export async function generateImage(prompt) {
  try {
    const modelId = "gemini-2.5-flash-image";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          // Required to tell the model to output an image instead of text
          responseModalities: ["IMAGE"],
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    console.log("Response ",response)

    // FIX: The response path for :generateContent is different
    // It's candidates -> content -> parts -> inlineData -> data
    const imagePart = response.data.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData
    );

    if (!imagePart || !imagePart.inlineData?.data) {
      throw new Error(
        "No image data returned. Prompt may have been blocked by safety filters."
      );
    }

    // Convert the base64 string to a Buffer
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
