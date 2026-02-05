const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
  try {
    const { recaptchaToken } = req.body;
    
    if (!recaptchaToken) {
         return res.status(400).json({ message: "reCAPTCHA verification missing" });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`
    );

    const { success, score } = response.data;

    // Lower threshold for localhost testing (Google often gives 0.1 on localhost)
    if (!success || score < 0.1) {
         console.warn(`Bot blocked! Score: ${score}, Success: ${success}`);
         return res.status(403).json({ message: "Bot activity detected. Access denied." });
    }

    next(); 
  } catch (error) {
    console.error("reCAPTCHA Error:", error.message);
    res.status(500).json({ message: "reCAPTCHA verification failed" });
  }
};

module.exports = verifyRecaptcha;
