import { consumer } from "../client/kafkaClient.js";
import { TOPICS } from "../topics/topics.js";
import { deserialize } from "../utils/serializer.js";

export const startAuthConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.USER_CREATED });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = deserialize(message);

      console.log("Event received:", data);
    },
  });
};