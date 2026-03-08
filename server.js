const express = require("express");
const app = express();

app.use(express.json());

let smsStore = [];

/*
Store SMS
*/
app.post("/sendos", (req, res) => {

    const { sender, message, timestamp } = req.body;

    const sms = {
        sender,
        message,
        timestamp,
        created: Date.now()
    };

    smsStore.unshift(sms);

    res.json({ status: "stored" });

});


/*
Fetch SMS
*/
app.get("/fetch", (req, res) => {

    res.json(smsStore);

});


/*
Auto delete after 15 minutes
*/
setInterval(() => {

    const now = Date.now();

    smsStore = smsStore.filter(sms => now - sms.created < 15 * 60 * 1000);

}, 60000);


/*
Keep Server Alive
*/
app.get("/", (req, res) => {

    res.send("Server Running");

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("Server running on port", PORT);

});
