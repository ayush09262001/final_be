const pool = require("../../config/db");
const express = require("express");
const app = express();
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const logger = require("../../logger");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add analytic threshold
exports.addAnalyticsThreshold = async (req, res) => {
  try {
    const {
      customer_id,
      title,
      status,
      userUUID,
      brake,
      tailgating,
      rash_driving,
      sleep_alert,
      over_speed,
      green_zone,
      minimum_distance,
      minimum_driver_rating,
      ttc_difference_percentage,
      total_distance,
      duration,
    } = req.body;

    // Validate input data here

    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const threshold_uuid = uuidv4();

    const insertQuery = `
      INSERT INTO thresholds
      (threshold_uuid, user_uuid, title, score, incentive, accident, leadership_board, halt, status, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      threshold_uuid,
      customer_id,
      title,
      JSON.stringify({
        brake,
        tailgating,
        rash_driving,
        sleep_alert,
        over_speed,
        green_zone,
      }),
      JSON.stringify({ minimum_distance, minimum_driver_rating }),
      JSON.stringify({ ttc_difference_percentage }),
      JSON.stringify({ total_distance }),
      JSON.stringify({ duration }),
      status,
      currentTimeIST,
      userUUID,
    ];

    const connection = await pool.getConnection();

    const [results] = await connection.execute(insertQuery, values);

    res
      .status(201)
      .json({ message: "Analytics Thresholds Added Successfully!", results });

    connection.release();
  } catch (err) {
    logger.error("Error adding analytics thresholds:", err);
    res.status(500).json({ message: "Error in Add Analytics Thresholds" });
  }
};

// Get analyticData
exports.getAnalyticsThreshold = async (req, res) => {
  try {
    // Connection To the Database
    const connection = await pool.getConnection();

    const getQuery =
      "SELECT thresholds.*, CONCAT(users.first_name, ' ', users.last_name) AS customer_name FROM thresholds INNER JOIN users ON thresholds.user_uuid = users.user_uuid WHERE thresholds.status != ? ORDER BY threshold_id DESC";
    const [analyticData] = await connection.execute(getQuery, [0]);

    res.status(200).send({ total_count: analyticData.length, analyticData });

    connection.release();
  } catch (err) {
    logger.error(`Error in fetching analytical threshold data ${err}`);
    res.status(500).send({
      message: "Error in fetching the list of analytical thresholds",
      err,
    });
  }
};

exports.updateAnalyticsThresholds = async (req, res) => {
  try {
    const { threshold_uuid } = req.params;
    const {
      user_uuid,
      title,
      score,
      incentive,
      accident,
      leadership_board,
      halt,
      status,
      userUUID,
    } = req.body;

    // Validate incoming data here
    if (
      !user_uuid ||
      !title ||
      !score ||
      !incentive ||
      !accident ||
      !leadership_board ||
      !halt
    ) {
      return res
        .status(400)
        .json({ message: "Invalid data. Please provide all required fields." });
    }

    // Connection To the Database
    const connection = await pool.getConnection();

    // Generate current time in Asia/Kolkata timezone
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const updateQuery =
      "UPDATE thresholds SET user_uuid=?,title=?, score=?, incentive=?, accident=?, leadership_board=?, halt=?, status=?, modified_at=?, modified_by = ? WHERE threshold_uuid=?";
    const values = [
      user_uuid,
      title,
      JSON.stringify(score),
      JSON.stringify(incentive),
      JSON.stringify(accident),
      JSON.stringify(leadership_board),
      JSON.stringify(halt),
      status,
      currentTimeIST,
      userUUID,
      threshold_uuid,
    ];

    const [results] = await connection.execute(updateQuery, values);
    res
      .status(200)
      .json({ message: "Analytics Thresholds Updated Successfully", results });
    connection.release();
  } catch (err) {
    logger.error(`Error in updating analytics thresholds: ${err}`);
    res.status(500).json({ message: "Error in Updating Analytics Thresholds" });
  }
};

exports.deleteAnalyticsThresholds = async (req, res) => {
  const { threshold_uuid } = req.params;
  //const { user_uuid} = req.body;
  //connection to database
  const connection = await db();

  //creating current date and time
  let createdAt = new Date();
  let currentTimeIST = moment
    .tz(createdAt, "Asia/Kolkata")
    .format("YYYY-MM-DD HH:mm:ss ");

  try {
    const deleteQuery =
      "UPDATE thresholds SET status=?, modified_at=?, modified_by=? WHERE threshold_uuid=?";

    const [results] = await connection.execute(deleteQuery, [
      2,
      currentTimeIST,
      threshold_uuid,
      threshold_uuid,
    ]);

    res
      .status(201)
      .send({ message: "Analytics Thresholds deleted successfully", results });
  } catch (err) {
    console.error("Error deleteing AT:", err);
    res
      .status(500)
      .send({ message: "Error in deleting the Analytics Thresholds " });
  } finally {
    connection.release();
  }
};

exports.getByIdAnalyticsThresholds = async (req, res) => {
  const { threshold_uuid } = req.params;

  // Connection To the Database
  const connection = await db();

  try {
    const getAnalyticsThresholds =
      "SELECT * FROM thresholds WHERE status = ? AND threshold_uuid = ?";

    const [results] = await connection.execute(getAnalyticsThresholds, [
      1,
      threshold_uuid,
    ]);

    res
      .status(201)
      .send({ message: " Analytics Thresholds Get Succesfully", results });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error In getting Analytics Thresholds", Error: "err" });
    console.log("data", err);
  } finally {
    connection.release();
  }
};