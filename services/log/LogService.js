import Log from "../../models/log/LogSchema.js";

// ================= GET LOGS =================
export const getlog = async ({ offset = 0, search = "", pagination = true }) => {
  try {
    const searchObject = search
      ? { title: { $regex: search.trim(), $options: "i" } }
      : {};

    const query = Log.find(searchObject)
      .populate("userId", "fullname role") // 👤 include user details
      .sort({ createdAt: -1 });

    const totalCount = await Log.countDocuments(searchObject);
    const logstore = pagination ? await query.skip(+offset).limit(10) : await query;

    return { logstore, totalCount };
  } catch (error) {
    throw error;
  }
};