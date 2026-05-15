export const serialize = (data) => JSON.stringify(data);
export const deserialize = (msg) => JSON.parse(msg.value.toString());