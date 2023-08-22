const pool = require("../../config/db.js");
const moment = require("moment-timezone");
const logger = require("../../logger.js");

// Add the device to database
const addDevice = async (req, res) => {
  try {
    const { device_id, device_type, user_uuid, sim_number, status, userUUID } =
      req.body;

    // Connection to the database
    const connection = await pool.getConnection();

    // Creating current date and time
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const checkQuery = "SELECT sim_number FROM devices WHERE sim_number=?";

    const [checksim] = await connection.execute(checkQuery, [sim_number]);

    if (checksim.length > 0) {
      return res
        .status(400)
        .json({ message: "Device with this SIM number already exists" });
    }

    const addQuery =
      "INSERT INTO devices(`device_id`,`device_type`,`user_uuid`,`sim_number`,`device_status`,`created_at`,`created_by`) VALUES (?,?,?,?,?,?,?)";

    const values = [
      device_id,
      device_type,
      user_uuid,
      sim_number,
      parseInt(status),
      currentTimeIST,
      userUUID,
    ];

    const [results] = await connection.execute(addQuery, values);

    res.status(201).json({
      message: "Device added successfully",
      totalCount: results.length,
      results,
    });

    connection.release();
  } catch (err) {
    logger.error(`Error in adding device: ${err}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Edit device the device
const editDevice = async (req, res) => {
  try {
    const {
      device_id,
      device_type,
      user_uuid,
      sim_number,
      device_status,
      userUUID,
    } = req.body;

    // Connection to database
    const connection = await pool.getConnection();

    //creating current date and time
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const editQuery = `UPDATE devices SET device_id=?, device_type = ?, user_uuid = ?, sim_number = ?, device_status = ?, modified_at = ?, modified_by = ? WHERE device_id = ?`;

    const values = [
      device_id,
      device_type,
      user_uuid,
      sim_number,
      parseInt(device_status),
      currentTimeIST,
      userUUID,
      req.params.device_id,
    ];

    const [results] = await connection.execute(editQuery, values);
    res.status(201).json({
      message: "Device updated successfully",
      totalCount: results.length,
      results,
    });
    connection.release();
  } catch (err) {
    logger.error(`Error in updating device ${err}`);
    res.status(500).send({ message: "Error in updating device", err });
  }
};

// Delete device
const deleteDevice = async (req, res) => {
  try {
    const { device_id } = req.params;

    //connection to database
    const connection = await pool.getConnection();

    //creating current date and time
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const deleteQuery =
      "UPDATE devices SET device_status=?, modified_at=?, modified_by=? WHERE device_id=?";

    const [results] = await connection.execute(deleteQuery, [
      0,
      currentTimeIST,
      req.body.userUUID,
      device_id,
    ]);

    res.status(201).send({
      message: "Device deleted successfully",
      totalCount: results.length,
      results,
    });
    connection.release();
  } catch (err) {
    logger.error(`Error in deleting the device ${err}`);
    res
      .status(500)
      .send({ message: "Error in deleting the device", Error: err });
  }
};

// Get list of all devices from database whoes status=active
const getDevices = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const getQuery = `
      SELECT devices.*, CONCAT(users.first_name, ' ', users.last_name) AS full_name
      FROM devices
      INNER JOIN users ON devices.user_uuid = users.user_uuid
      WHERE devices.device_status != ? ORDER BY devices.id DESC
    `;
    const [devices] = await connection.execute(getQuery, [0]);

    res.status(200).send({
      message: "Successfully fetched list of all devices with full names",
      totalCount: devices.length,
      devices,
    });
    connection.release();
  } catch (err) {
    logger.error(`Error in getting the list, Error: ${err} `);
    res.status(500).send({ message: "Error in getting the list", Error: err });
  }
};

// Get device by device id
const getDeviceById = async (req, res) => {
  try {
    const deviceID = req.params.device_id;

    const connection = await pool.getConnection();
    const getQuery = `
      SELECT * FROM devices where device_id = ?
    `;
    const [device] = await connection.execute(getQuery, [deviceID]);

    res.status(200).send({
      message: "Successfully fetched the device details",
      totalCount: device.length,
      device,
    });
    connection.release();
  } catch (err) {
    logger.error(`Error in getting data, Error: ${err} `);
    res.status(500).send({ message: "Error in data", Error: err });
  }
};

// Get list of all devices from database whoes status=active
const getCustomerList = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const getQuery =
      "SELECT user_uuid, first_name, last_name FROM users WHERE user_status=? AND user_type=?";
    const [users] = await connection.execute(getQuery, [1, 2]);

    res.status(200).send({
      message: "Successfully fetched list of customers",
      totalCount: users.length,
      users,
    });
    connection.release();
  } catch (err) {
    logger.error(`Error in getting the list, Error: ${err} `);
    res.status(500).send({ message: "Error in getting the list", Error: err });
  }
};

// //get list of devices which are assign to particular user
// const getusersDevices = async (req, res) => {
//   const { user_uuid } = req.params;

//   const connection = await db();

//   try {
//     const getUserDevices =
//       "SELECT * FROM devices WHERE device_status=? AND user_uuid=?";

//     const [results] = await connection.execute(getUserDevices, [1, user_uuid]);

//     res.status(200).send({
//       message: "Successfully got list of users devices",
//       devices,
//       results,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .send({ message: "Error in getting users devices", Error: err });
//   } finally {
//     connection.release();
//   }
// };

// //get list of all ecu which are not assign to any vehicle and device assign to particular user
// const getUserEcu = async (req, res) => {
//   const { user_uuid } = req.params;

//   const connection = await db();

//   try {
//     const getQuery =
//       "SELECT id, device_id, device_type, sim_number FROM devices LEFT JOIN vehicles ON devices.device_id = vehicles.ecu WHERE devices.device_type = 'ECU' AND vehicles.vehicle_uuid IS NULL AND devices.user_uuid = ? AND devices.device_status = 1";
//     const [results] = await connection.execute(getQuery, [user_uuid]);
//     res.status(200).send({
//       message: "Successfuly got list of ECU",
//       totalCount: results.length,
//       results,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .send({ message: "Error in getting the users ecu", Error: err });
//   } finally {
//     connection.release();
//   }
// };

// //get list of all iot which are not assign to any vehicle and device assign to particular user
// const getUserIot = async (req, res) => {
//   const { user_uuid } = req.params;

//   const connection = await db();

//   try {
//     const getQuery =
//       "SELECT id, device_id, device_type, sim_number FROM devices LEFT JOIN vehicles ON devices.device_id = vehicles.iot WHERE devices.device_type = 'IoT' AND vehicles.vehicle_uuid IS NULL AND devices.user_uuid = ? AND devices.device_status = 1";
//     const [results] = await connection.execute(getQuery, [user_uuid]);
//     res.status(200).send({
//       message: "Successfully got list of IoT",
//       totalCount: results.length,
//       results,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .send({ message: "Error in getting the users ecu", Error: err });
//   } finally {
//     connection.release();
//   }
// };

// //get list of all dms which are not assign to any vehicle and device assign to particular user
// const getUserDMS = async (req, res) => {
//   const { user_uuid } = req.params;

//   const connection = await db();

//   try {
//     const getQuery =
//       "SELECT id, device_id, device_type, sim_number FROM devices LEFT JOIN vehicles ON devices.device_id = vehicles.dms WHERE devices.device_type = 'DMS' AND vehicles.vehicle_uuid IS NULL AND devices.user_uuid = ? AND devices.device_status = 1";
//     const [results] = await connection.execute(getQuery, [user_uuid]);
//     res.status(200).send({
//       message: "Successfully got list of DMS",
//       totalCount: results.length,
//       results,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .send({ message: "Error in getting the users ecu", Error: err });
//   } finally {
//     connection.release();
//   }
// };

// get all devices count
const deviceCount = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "SELECT COUNT(*) AS count FROM devices WHERE device_status != ?",
      [0]
    );
    res
      .status(200)
      .json({ message: "Successfully received devices count.", result });
    connection.release();
  } catch (error) {
    logger.error("Error in fetching data", error);
    res.status(501).json({ message: "Unable to fetch total devices!" });
  }
};

module.exports = {
  addDevice,
  editDevice,
  deleteDevice,
  getDevices,
  // getusersDevices,
  // getUserEcu,
  // getUserIot,
  // getUserDMS,
  deviceCount,
  getCustomerList,
  getDeviceById,
};