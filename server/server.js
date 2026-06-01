const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());


app.use('/api/recommend', require('./routes/recommend'));

app.use('/api/chat', require('./routes/chat'));

app.get("/check-health", (req, res) => {
    res.status(200).json({ message: "Server is running" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
