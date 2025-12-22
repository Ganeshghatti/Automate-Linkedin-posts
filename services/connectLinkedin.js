import express from "express";
import axios from "axios";
import dotenv from "dotenv";

const router = express.Router();
dotenv.config();

// STEP 1: Redirect to LinkedIn
router.get("/connect/linkedin", (req, res) => {
  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&` +
    `state=test_state_123&` +
    `scope=${encodeURIComponent("openid profile w_member_social")}`;

  res.redirect(authUrl);
});

// STEP 2: Callback
router.get("/linkedin/connect", async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    // Fetch access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        },
      }
    );
    const accessToken = tokenResponse.data.access_token;

    // Fetch personId
    const profileResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const personId = profileResponse.data.sub;

    // saveToEnv("LINKEDIN_ACCESS_TOKEN", accessToken);
    // saveToEnv("LINKEDIN_PERSON_ID", personId);
    console.log("LINKEDIN_ACCESS_TOKEN", accessToken);
    console.log("LINKEDIN_PERSON_ID", personId)

    res.json({
      success: true,
      accessToken: tokenResponse.data.access_token,
      expiresIn: tokenResponse.data.expires_in,
    });
  } catch (err) {
    res.status(500).json(err.response?.data || err.message);
  }
});

export default router;