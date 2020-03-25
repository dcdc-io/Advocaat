import * as fuxor from 'fuxor'
import * as pouchdbSecurity from '../../pouchdb-security'
fuxor.add('pouchdb-security', pouchdbSecurity)

import slouchdbSecurity from '../../slouchdb-security'

import PouchDB from 'pouchdb'
import express from 'express'
import expressPouchdb from 'express-pouchdb'
import path from 'path'

import sirv from 'sirv';
import compression from 'compression';
import * as sapper from '@sapper/server';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

express().get(
	'/db/_utils', (req, res) => {
		if (req.originalUrl === '/db/_utils')
			res.redirect(301, '/db/_utils/')
		else
			res.sendFile(process.cwd() + "/_utils/index.html")
	}
).use(
	'/db/_utils',
	express.static(process.cwd() + '/_utils')
).use(
	'/db',
	expressPouchdb(
		PouchDB.defaults({
			prefix: './db/'
		}).plugin(slouchdbSecurity), {
			mode: 'fullCouchDB',
			overrideMode: {
				exclude: ['routes/fauxton']
			}
		}
	),
).use(
	compression({ threshold: 0 }),
	sirv('static', { dev }),
	sapper.middleware()
).listen(PORT, err => {
	if (err) console.log('error', err)
})