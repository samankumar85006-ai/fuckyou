const express = require("express");

const app = express();

app.use(express.json());

let smsDatabase = [];

/*
SEND SMS API
*/

app.post("/sendos", (req, res) => {

    const { sender, message, timestamp } = req.body;

    if (!sender || !message) {
        return res.status(400).json({ error: "Invalid data" });
    }

    const sms = {
        sender: sender,
        message: message,
        timestamp: timestamp,
        createdAt: Date.now()
    };

    smsDatabase.unshift(sms);

    res.json({ status: "SMS Stored" });

});

/*
FETCH ALL SMS
*/

app.get("/fetch", (req, res) => {

    res.json({
        total: smsDatabase.length,
        sms: smsDatabase
    });

});

/*
AUTO DELETE AFTER 15 MIN
*/

setInterval(() => {

    const now = Date.now();

    smsDatabase = smsDatabase.filter(sms => {

        return now - sms.createdAt < 15 * 60 * 1000;

    });

}, 60000);


/*
SERVER STATUS
*/

app.get("/", (req, res) => {

    res.send("SMS Server Running");

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("Server running on port", PORT);

});
