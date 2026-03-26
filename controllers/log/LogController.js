import * as logService from "../../services/log/LogService.js";

export const getlog = async (req, res) => {
  try {
    const result = await logService.getlog(req.body);
    res.status(200).json({
      success: true,
      message: "Logs fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};