import kafkaProducer from "../../../../kafka/client/kafkaClient.js";

/**
 * AUTH EVENTS TOPIC NAMES
 */
const TOPIC = {
  USER_REGISTERED: "auth.user.registered",
  USER_LOGGED_IN: "auth.user.loggedin",
  USER_LOGGED_OUT: "auth.user.loggedout",
  USER_UPDATED: "auth.user.updated",
  USER_DELETED: "auth.user.deleted",
};

/**
 * SEND USER REGISTER EVENT
 */
export const emitUserRegistered = async (user) => {
  try {
    await kafkaProducer.send({
      topic: TOPIC.USER_REGISTERED,
      messages: [
        {
          key: user._id.toString(),
          value: JSON.stringify({
            userId: user._id,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            createdAt: new Date(),
          }),
        },
      ],
    });
  } catch (err) {
    console.error("Kafka USER_REGISTERED event failed:", err.message);
  }
};

/**
 * LOGIN EVENT
 */
export const emitUserLoggedIn = async (user) => {
  try {
    await kafkaProducer.send({
      topic: TOPIC.USER_LOGGED_IN,
      messages: [
        {
          key: user._id.toString(),
          value: JSON.stringify({
            userId: user._id,
            role: user.role,
            loginAt: new Date(),
          }),
        },
      ],
    });
  } catch (err) {
    console.error("Kafka USER_LOGGED_IN event failed:", err.message);
  }
};

/**
 * LOGOUT EVENT
 */
export const emitUserLoggedOut = async (userId) => {
  try {
    await kafkaProducer.send({
      topic: TOPIC.USER_LOGGED_OUT,
      messages: [
        {
          key: userId.toString(),
          value: JSON.stringify({
            userId,
            logoutAt: new Date(),
          }),
        },
      ],
    });
  } catch (err) {
    console.error("Kafka USER_LOGGED_OUT event failed:", err.message);
  }
};