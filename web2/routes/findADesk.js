const express = require("express");
const router = express.Router();
const mqtt = require("mqtt");

const Chair = require("../models/Chair");
const Room = require("../models/Room");

// -----CONNECT TO MQTT-----
const client = mqtt.connect("mqtt://broker.mqttdashboard.com");
// The web app needs 3 subscriptions.
// 1. For publishing information to the stack
// 2. For subscribing to information from the stack
// 3. For subscribing to information from the desktop (processing)
client.on("connect", async () => {
  console.log("Connected to MQTT.");
  try {
    await client.subscribe("FindADesk_WebToStack");
    console.log("Ready to publish to stack.");
    await client.subscribe("FindADesk_StackToWeb");
    console.log("Ready to receive from stack.");
    await client.subscribe("FindADesk_test");
    // await client.subscribe("FindADesk_ProcessingToWeb");
    console.log("Ready to receive from desktop.");
  } catch (err) {
    console.log(err);
  }
});

// -----MQTT MESSAGE HANDLER-----
client.on("message", function(topic, message) {
  if (topic == "FindADesk_StackToWeb") {
    updateChairState(message.toString());
    console.log("Received from stack");
  }
  // if (topic == "FindADesk_ProcessingToWeb") {
  if (topic == "FindADesk_test") {
    updateRoomState(message.toString());
  }
});

// -----ROUTES-----

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.get("/map", async (req, res) => {
  try {
    // find every building (but just once)
    let buildingList = await Room.collection.distinct("buildingName");
    res.render("map", { buildingList: buildingList });
  } catch {
    res.redirect("/");
  }
  res.render("map");
});

router.get("/buildings/:name", async (req, res) => {
  try {
    // find every building (but just once)
    let buildingList = await Room.collection.distinct("buildingName");
    // find all rooms within the selected building.
    const rooms = await Room.find({
      buildingName: req.params.name
    });
    res.render("building", { rooms: rooms, buildingList: buildingList });
  } catch {
    res.redirect("/map");
  }

  res.render("rooms");
});

router.get("/chairs/:id", async (req, res) => {
  try {
    // find every building (but just once)
    let buildingList = await Room.collection.distinct("buildingName");
    // Get the correct room from the params
    const room = await Room.findById(req.params.id);
    res.render("chairs", { room: room, buildingList: buildingList });
  } catch {
    res.redirect("/map");
  }

  res.render("rooms");
});

async function updateRoomState(string) {
  const roomObject = JSON.parse(string);
  let room;
  try {
    room = await Room.findOne({ roomId: roomObject.roomId }).exec();
    if (room != null) {
      // Update the old room with the new data
      room.buildingId = roomObject.buildingId;
      room.buildingName = roomObject.buildingIName;
      room.roomId = roomObject.roomId;
      room.roomName = roomObject.roomName;
      room.tables = roomObject.tables;
      console.log("Room updated");
    } else {
      // Create a new room with the data
      room = new Room({
        buildingId: roomObject.buildingId,
        buildingName: roomObject.buildingName,
        roomId: roomObject.roomId,
        roomName: roomObject.roomName,
        tables: roomObject.tables
      });
      await room.save();
      console.log("Room saved");
    }
  } catch {
    res.send("Something went wrong");
  }
}

async function deleteRoom(string) {
  const roomObject = JSON.parse(string);
  let room;
  try {
    room = await Room.findOne({ roomId: roomObject.roomId }).exec();
    if (room != null) {
      await room.remove();
    } else {
      console.log("That room does not exist.");
    }
  } catch {
    res.send("Something went wrong");
  }
}

async function updateChairState(string) {
  const chairObject = JSON.parse(string);
  let chair;
  try {
    room = await Room.findOne({ roomId: roomObject.roomId }).exec();
    if (room != null) {
      await room.remove();
    } else {
      console.log("That room does not exist.");
    }
  } catch {
    res.send("Something went wrong");
  }
}

module.exports = router;
