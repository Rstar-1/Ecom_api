import { Kafka } from "kafkajs";


export const kafka = new Kafka({
  clientId: "auth-service",
  brokers: ["localhost:9092"],
  retry: {
    initialRetryTime: 300,
    retries: 5,
  },
});