import PouchDB from 'pouchdb'
import PouchDBAuthentication from 'pouchdb-authentication'
import pouchdbfind from 'pouchdb-find'
import { setContext, getContext } from 'svelte'
import { writable } from 'svelte/store'
PouchDB.plugin(PouchDBAuthentication)
PouchDB.plugin(pouchdbfind)

let dbUrl = ""
export const setDatabaseUrl = (url) => {
    console.log("setDatabaseUrl has been called")
    dbUrl = url
}

export const useDatabase = ({name, sync = true}) => {
    console.log("useDatabase has been called")
    const url = `${dbUrl.replace(/\/$/, '')}${name ? '/' : ''}${name && name.replace(/^\//, '')}`
    const remote = new PouchDB(url, {skip_setup: true})
    const local = new PouchDB(`${name}`)
    if (sync) {
        local.sync(remote, {live:true, retry:true}).on('error', console.log.bind(console))
    }
    
    local.__remote = remote
    return local
}

export const login = async ({username, password, force = false}) => {
    let local
    try {
        local = useDatabase({name: "_users", sync: false})
        const result = await local.__remote.logIn(username, password)
        // set loggedIn (use js api because we're outside svelte)
        const { loggedIn, username:dbUsername } = getContext("user")
        dbUsername.set((await local.__remote.getSession()).userCtx.name)
        loggedIn.set(true)
        return result
    } catch (e) {
        console.error(e)
        throw(e)
    } finally {
        local.__remote.close()
        local.close()
    }
}

export const autoLogin = async ({ loggedIn, username }) => {
    console.log("auto login")
    let local
    try {
        local = useDatabase({name: "_users", sync: false})
        const session = await local.__remote.getSession()
        if (session.ok && session.userCtx.name) {
            username.set(session.userCtx.name)
            loggedIn.set(true)
        }
    } catch (e) {
        // don't rethrow
        console.log(e)
    } finally {
        local.__remote.close()
        local.close()
    }
}

const register_user = {
    username: "register",
    password: "register"
}

export const signUp = async(username, password ) =>{
    try {
        const database = useDatabase({name:"_users"}).__remote
        if((await database.getSession()).userCtx.name != "register")
        {
            await database.logOut()
            console.log (await login(register_user))   
        }
        console.log ((await database.getSession()).userCtx.name)
        const result = await database.signUp(username, password)
        await database.logOut()
        console.log ((await database.getSession()).userCtx.name)
        await login({username: username ,password: password})
        return result
    } catch (e) {
        console.log("signup Error")
        console.log(e)
        throw (e)
    }
}
/*
export const logOut = async () => {
    const remote = new PouchDB(remoteURL, {skip_setup:true})
    const { loggedIn } = getContext("user")
    loggedIn.set(false)
    await remote.logOut();
}
*/

export let colourInvert = writable(false)