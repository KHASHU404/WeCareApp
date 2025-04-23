const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendEmergencyAlert = functions.https.onCall(async (data, context) => {
  const { token } = data;
  if (!token) {
    throw new functions.https.HttpsError("invalid-argument", "FCM token is missing.");
  }

  const payload = {
    notification: {
      title: "🚨 Emergency Alert!",
      body: "A user near you needs help. Open the app to assist!",
    },
  };

  try {
    await admin.messaging().sendToDevice(token, payload);
    return { success: true };
  } catch (error) {
    console.error("Error sending alert:", error);
    throw new functions.https.HttpsError("unknown", "Failed to send alert.");
  }
});
