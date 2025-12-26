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

export async function generateImage(
  postText,
  slideContext = "Single LinkedIn post visual"
) {
  try {
    const modelId = "gemini-2.5-flash-image";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;

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

PRIMARY CONTEXT:
"${slideContext}"

OBJECTIVE:
Create a clean, modern, premium-quality LinkedIn visual that:
- Visually supports the idea
- Uses short text only where it adds clarity
- Feels credible, calm, and professional for a tech audience

TEXT USAGE (IMPORTANT):
 -Geist-style modern sans-serif
- Text IS ALLOWED when necessary
- Do NOT repeat the full post text
- Text should guide the viewer, not explain everything

VISUAL STYLE & MOOD:
- Minimal and uncluttered
- Modern, editorial-style design
- Soft abstract gradients or subtle geometric shapes
- Calm, trustworthy, and contemporary

- Color palette ONLY:
      - Dark: #0a0603
      - White: #ffffff
      - Light gray: #f6f6f6
      - Accent orange: #ff5733

TYPOGRAPHY (if text appears):
- Clean, modern sans-serif
- High contrast for readability
- Professional, balanced spacing
- No decorative or playful fonts

CONTENT RULES:
- Do NOT copy layout or text from reference images
- Use reference images ONLY for visual quality and style
- No logos, watermarks, or brand names
- No dense paragraphs or bullet lists

COMPOSITION GUIDANCE:
- Clear visual hierarchy
- Plenty of whitespace
- One main focal area
- Designed like a professional LinkedIn carousel slide

REFERENCE IMAGES:
Use only for:
- Design polish
- Spacing
- Color harmony
- Overall visual quality

POST CONTEXT (for understanding only, do not replicate verbatim):
"${postText}"

FINAL OUTPUT:
A single, high-resolution LinkedIn-ready image with
minimal but meaningful text where it improves clarity.
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

export async function generateImages(postText, slideContexts) {
  try {
    const imagePromises = slideContexts.map((context) =>
      generateImage(postText, context)
    );
    return await Promise.all(imagePromises);
  } catch (error) {
    console.error("Batch generation failed:", error.message);
    throw error;
  }
}
