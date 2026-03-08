const express = require("express");

const app = express();

app.use(express.json());

let smsDatabase = [];

/*
STORE SMS
*/

app.post("/sendos", (req, res) => {

    const { sender, message, timestamp } = req.body;

    if (!sender || !message) {
        return res.status(400).json({ error: "Invalid data" });
    }

    const sms = {
        sender,
        message,
        timestamp,
        createdAt: Date.now()
    };

    smsDatabase.unshift(sms);

    res.json({ status: "SMS Stored" });

});


/*
JSON API
*/

app.get("/fetch", (req, res) => {

    res.json({
        total: smsDatabase.length,
        sms: smsDatabase
    });

});


/*
HTML LIST VIEW
*/

app.get("/sms", (req, res) => {

    let html = `
    <!DOCTYPE html>
    <html>
    <head>

    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>SMS Dashboard</title>

    <style>

    body{
        font-family: Arial;
        background:#0f172a;
        margin:0;
        padding:20px;
        color:white;
    }

    h1{
        text-align:center;
    }

    .container{
        max-width:800px;
        margin:auto;
    }

    .card{
        background:#1e293b;
        padding:15px;
        margin-bottom:15px;
        border-radius:10px;
        box-shadow:0 5px 15px rgba(0,0,0,0.3);
    }

    .sender{
        font-weight:bold;
        font-size:18px;
        color:#38bdf8;
    }

    .message{
        margin-top:10px;
        font-size:16px;
        word-wrap:break-word;
    }

    .time{
        margin-top:8px;
        font-size:12px;
        color:#94a3b8;
    }

    @media(max-width:600px){
        .card{
            padding:12px;
        }

        .sender{
            font-size:16px;
        }

        .message{
            font-size:14px;
        }
    }

    </style>

    </head>

    <body>

    <div class="container">

    <h1>📩 SMS Dashboard</h1>
    `;


    smsDatabase.forEach(sms => {

        const date = new Date(sms.timestamp).toLocaleString();

        html += `
        <div class="card">

            <div class="sender">📞 ${sms.sender}</div>

            <div class="message">${sms.message}</div>

            <div class="time">🕒 ${date}</div>

        </div>
        `;

    });


    html += `
    </div>
    </body>
    </html>
    `;

    res.send(html);

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
