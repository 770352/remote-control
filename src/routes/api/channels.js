const router = require("express").Router();
const auth = require("../auth");
const {
  createChannel,
  getChannels,
  deleteChannel
} = require("../../models/channel");
const { validateOwner } = require("../../models/robotServer");

router.get("/list/:id", async (req, res) => {
  let response = {};
  const result = await getChannels(req.params.id);
  if (result) {
    response.channels = result;
  } else {
    response.error = "unable to get channels for specified server";
  }
  res.status(200).send(response);
});

router.get("/create", async (req, res) => {
  let response = {};
  response.server_id = "<Please provide a server_id to add channel too >";
  response.channel_name = "<Please provide a name for your new channel>";
  response.authorization = "required";
  res.status(200).send(response);
});

router.post("/create", auth({ user: true }), async (req, res) => {
  const { validateChannelName } = require("../../controllers/validate");
  let response = {};
  let makeChannel = {};

  if (req.body.server_id && req.body.channel_name && req.user) {
    response.channel_name = validateChannelName(req.body.channel_name);
    response.user = { username: req.user.username, id: req.user.id };
    response.server_id = req.body.server_id;

    if (response.channel_name.error) {
      res.send(response.channel_name);
      return;
    }

    const getServer = await validateOwner(response.user.id, response.server_id);

    if (getServer) {
      response.validated = true;
    } else {
      response.error = "user does not appear to own this server.";
    }
  } else {
    response.error = "unable to determine user information.";
  }

  try {
    //TODO: Add default chatroom if none is provided
    makeChannel = await createChannel({
      host_id: response.server_id,
      name: response.channel_name
    });

    if (makeChannel) {
      response.success = "Channel successfully created!";
      response.channel = makeChannel;
    }
  } catch (err) {
    console.log("CREATE CHANNEL ERROR: ", err);
    response.error = "There was a problem creating this channel";
    response.error_details = makeChannel;
  }

  console.log(response);
  if (!response.error) return res.status(201).send(response);
  else return res.send(response);
});

router.get("/delete", async (req, res) => {
  response = {};
  response.channel_id = "<Channel ID Required>";
  response.authorization = "<Authorization Required>";

  res.status(200).send(response);
  console.log(response);
});

//Delete Channel
router.post("/delete", auth({ user: true }), async (req, res) => {
  console.log("DELETING CHANNEL: ", req.body.channel_id);
  let response = {};
  if (req.body.channel_id && req.body.server_id && req.user)
    response.channel_id = req.body.channel_id;
  response.server_id = req.body.server_id;
  response.user = { username: req.user.username, id: req.user.id };

  validate = await validateOwner(req.user.id, response.server_id);
  if (validate) {
    response.validated = true;
    // response.validate = true;
    const result = await deleteChannel(req.body.channel_id, req.body.server_id);
    response.status = result.status;
  }
  if (!response.error) res.status(200).send(response);
  res.send(response);
});

module.exports = router;
