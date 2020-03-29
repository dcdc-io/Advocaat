import calculateSessionId from 'couchdb-calculate-session-id'
import { sendMail } from "../helpers.js"
import assert from "assert"

export async function post(req, res, next) {
    const _users = await require("express-pouchdb/lib/utils").getUsersDB(globalThis.appContext, globalThis.dbContext)
    if (req.body.email && !req.body.password) {
        // magic link email
        // calculateSessionId(userDoc.name, userDoc.salt, info.secret, timestamp());
        const user = await _users.get(`org.couchdb.user:${req.body.email.toLowerCase()}`)
        const info = await await require("pouchdb-auth/lib/utils").dbDataFor(_users)
        const sessionID = calculateSessionId(user.name, user.salt, info.secret, Math.round(Date.now() / 1000))
        // send session ID to user as email
        sendMail({
            to: user.name,
            template: "magiclink",
            params: { sessionID }
        })
        res.send({ok:true})
        return
    }
    try {
        const login = await _users.multiUserLogIn(req.body.email.toLowerCase(), req.body.password)
        assert(login.sessionID, "couldn't create session, does user exist?")
        res.cookie("AuthSession", login.sessionID)
        res.send({ok:true})
    } catch (e) {
        res.send({ok:false})
    }
}

export async function get(req, res, next) {
    // console.log(req.query.key)
    res.cookie("AuthSession", req.query.key)
    res.redirect("/")
}