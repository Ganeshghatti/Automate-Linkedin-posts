import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  generateSinglePost,
  generateCarouselPost,
} from "./services/textGenerator.js";
import {
  publishLinkedinImagePost,
  publishLinkedinDocumentPost,
} from "./services/postLinkedin.js";
import linkedinRoutes from "./services/connectLinkedin.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// generate content
app.post("/generate", async (req, res) => {
  try {
    const { topic, postType } = req.body;
    console.log("Topic is ", topic);
    console.log("Post type is ", postType);

    let generated;

    if (postType === "single") {
      generated = await generateSinglePost(topic);
    } else if (postType === "carousel") {
      generated = await generateCarouselPost(topic);
    } else {
      throw new Error("Invalid post type");
    }

    res.json({
      success: true,
      generated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// publish on linkedin
app.post("/publish", async (req, res) => {
  try {
    const { postType, generated } = req.body;

    let postId;

    if (postType === "single") {
      // Extract base64 from data URL (format: data:image/png;base64,<base64string>)
      const base64Data = generated.image.split(',')[1];
      postId = await publishLinkedinImagePost({
        text: generated.post,
        image: Buffer.from(base64Data, 'base64'),
      });
    } else if (postType === "carousel") {
      // For carousel, images might be data URLs, base64 strings, or serialized Buffers
      const imageBuffers = generated.images.map((img) => {
        if (typeof img === 'string' && img.startsWith('data:')) {
          // Extract base64 from data URL
          const base64Data = img.split(',')[1];
          return Buffer.from(base64Data, 'base64');
        } else if (typeof img === 'string') {
          // Already base64 string
          return Buffer.from(img, 'base64');
        } else if (img && img.type === 'Buffer' && Array.isArray(img.data)) {
          // Serialized Buffer from JSON (Node.js default serialization)
          return Buffer.from(img.data);
        } else {
          // Fallback: try to create buffer from whatever we have
          return Buffer.from(img);
        }
      });
      postId = await publishLinkedinDocumentPost({
        text: generated.post,
        images: imageBuffers,
      });
    } else {
      throw new Error("Invalid post type");
    }

    res.json({
      success: true,
      linkedinPostId: postId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// oauth of linkedin
app.use(linkedinRoutes);

app.listen(4000, () =>
  console.log("🚀 Server running on http://localhost:4000")
);
