import { producer } from "../client/kafkaClient.js";
import { TOPICS } from "../topics/topics.js";
import { serialize } from "../utils/serializer.js";

export const sendUserCreatedEvent = async (user) => {
  await producer.send({
    topic: TOPICS.USER_CREATED,
    messages: [{ value: serialize(user) }],
  });
};