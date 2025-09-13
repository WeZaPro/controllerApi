const line = require("@line/bot-sdk");
require("dotenv").config(); // โหลด .env ไฟล์

// config ของ LINE OA
const config = {
  channelAccessToken:
    "ER8oSzlDDk1H8HkkBNoyBUNntemq0GJdhVjnA3IVJMAh+PNOjFlHnVH95qmPJKu4co7EgKK2Pip86q52zMn8t1CNqAq+pofA3le3t0WmJsVg8V0Jqmhh0FKjXNb98ighg6CHJT4rvaEKd6H0UUM5zwdB04t89/1O/w1cDnyilFU=", // ใส่ Token ของ OA
  channelSecret: "066c773739e78a25b5accfb2ac49dda7",
};

const client = new line.Client(config);

/**
 * ส่งข้อความพร้อมรูปภาพไป LINE
 * @param {string} toUserId - userId หรือ groupId
 * @param {string} plate_str
 * @param {string} province_fullname
 * @param {string} imagePath - path ของไฟล์รูป
 */
async function sendPlateToLine(
  toUserId,
  plate_str,
  province_fullname,
  imagePath
) {
  try {
    // ข้อความพร้อมป้ายทะเบียน
    const textMessage = {
      type: "text",
      text: `📌 Plate: ${plate_str}\nProvince: ${province_fullname}`,
    };

    // รูปภาพ
    const imageMessage = {
      type: "image",
      originalContentUrl: imagePath, // ต้องเป็น URL เข้าถึงได้จากอินเทอร์เน็ต
      previewImageUrl: imagePath,
    };

    // ส่งข้อความ
    await client.pushMessage(toUserId, [textMessage, imageMessage]);
    console.log("✅ ส่งข้อมูลไป LINE OA สำเร็จ");
  } catch (err) {
    console.error("❌ ส่งข้อมูลไป LINE OA ไม่สำเร็จ:", err);
  }
}

module.exports = { sendPlateToLine };
