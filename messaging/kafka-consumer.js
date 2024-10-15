const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'shipply-app',
  brokers: ['localhost:9092'], // Update with your Kafka broker addresses
});

async function startConsumer(topic, messageHandler) {
  const consumer = kafka.consumer({ groupId: 'shipply-consumer-group' });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      await messageHandler(JSON.parse(message.value.toString()));
    },
  });
}

module.exports = { startConsumer };
