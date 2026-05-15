import { producer, consumer } from "./client/kafkaClient.js";
import { utils } from "./../shared/index.js";

const { info, error, warn } = utils;

// ================= CONNECT =================
export const connectKafka = async () => {
  try {
    await producer.connect();
    info("✅ Kafka Producer Connected");

    await consumer.connect();
    info("✅ Kafka Consumer Connected");

  } catch (error) {
    error(`❌ Kafka connection failed: ${error.message}`);
    throw error;
  }
};

// ================= DISCONNECT =================
export const disconnectKafka = async () => {
  try {
    await producer.disconnect();
    await consumer.disconnect();
    info("🛑 Kafka Disconnected");
  } catch (error) {
    error(`Kafka disconnect error: ${error.message}`);
  }
};

// ================= EXPORT CORE =================
export { producer, consumer };