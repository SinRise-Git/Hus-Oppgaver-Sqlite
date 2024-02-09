const express = require("express")
const path = require("path")
const sqlite3 = require('better-sqlite3')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv')
const session = require("express-session")
const uuid = require('uuid')    
const { request } = require("http")

dotenv.config();

const app = express();
const staticPath = path.join(__dirname, 'public')
const db = sqlite3('./database.db', { verbose: console.log })
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(express.static(staticPath));

app.get("/getUserRoles", getUserRoles)

app.get("/getUserWorkgroups", getUserWorkgroups)

async function getUserRoles(request, response) {
    const sql = db.prepare('SELECT * FROM usertype')
    let rows = sql.all()
    let roles = rows.map(role => ({
        id: role.ID,
        name: role.role
    }));
    response.send(roles)
}

async function getUserWorkgroups (request, response)  {
    const sql = db.prepare('SELECT * FROM workgroup')
    let rows = sql.all()
    let workgroups = rows.map(workgroup => ({
        id: workgroup.ID,
        name: workgroup.name
    }));
    response.send(workgroups)
}

app.listen(3012, () => {
    console.log("Server is running on http://localhost:3012/login-page.html");
});