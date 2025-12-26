import axios from "axios";
import { PDFDocument } from "pdf-lib";

export async function publishLinkedinImagePost({ text, image }) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;

  if (!accessToken || !personId) {
    throw new Error("LinkedIn credentials missing");
  }

  // STEP 1: Register image upload
  const registerRes = await axios.post(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${personId}`,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  const uploadUrl =
    registerRes.data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;

  const asset = registerRes.data.value.asset;

  // STEP 2: Upload image
  await axios.put(uploadUrl, image, {
    headers: { "Content-Type": "image/png" },
    maxBodyLength: Infinity,
  });

  // STEP 3: Publish post
  const postRes = await axios.post(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      author: `urn:li:person:${personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "IMAGE",
          media: [{ status: "READY", media: asset }],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  return postRes.data.id;
}

export async function publishLinkedinDocumentPost({ text, images }) {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const personId = process.env.LINKEDIN_PERSON_ID;

    if (!accessToken || !personId) {
      throw new Error("LinkedIn credentials missing");
    }

    const pdfDoc = await PDFDocument.create();
    for (const imageBuffer of images) {
      const image = await pdfDoc.embedPng(imageBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }
    const pdfBytes = await pdfDoc.save();

    const registerRes = await axios.post(
      "https://api.linkedin.com/v2/assets?action=registerUpload",
      {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-document"],
          owner: `urn:li:person:${personId}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    const uploadUrl =
      registerRes.data.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;

    const asset = registerRes.data.value.asset;

    await axios.put(uploadUrl, pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
      },
      maxBodyLength: Infinity,
    });

    const postRes = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: `urn:li:person:${personId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "DOCUMENT",
            media: [
              {
                status: "READY",
                media: asset,
              },
            ],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    return postRes.data.id;
  } catch (error) {
    console.error(
      "Error publishing LinkedIn document post:",
      error.response?.data || error.message
    );
    throw error;
  }
}
