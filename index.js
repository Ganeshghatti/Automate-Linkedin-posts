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
app.use(express.json());

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
      postId = await publishLinkedinImagePost({
        text: generated.post,
        image: Buffer.from(generated.image.data),
      });
    } else if (postType === "carousel") {
      postId = await publishLinkedinDocumentPost({
        text: generated.post,
        images: generated.images.map((img) => Buffer.from(img.data)),
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
