require('dotenv').config();

const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const uuid = require('uuid/v4');

const config = require('./config');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const { Pool } = require('pg');
const pgClient = new Pool({
	user: config.pgUser,
	host: config.pgHost,
	database: config.pgDatabase,
	password: config.pgPassword,
	port: config.pgPort
});
pgClient.on('error', () => console.log('No postgres connection'));

pgClient.query(`
	CREATE TABLE IF NOT EXISTS items(
		id uuid,
		item_name TEXT NOT NULL,
		complete BOOLEAN DEFAULT false,
		PRIMARY KEY (id)
	)
`).catch(err => console.log(err));

app.get('/test', (req, res) => {
	res.send('Working');
});

app.get('/v1/items', async (req, res) => {
	const items = await pgClient.query('SELECT * FROM items').catch(e => { res.status(500).send(`No items`); });
	res.status(200).send(items.rows);
});

app.get('/v1/items', async (req, res) => {
	const id = req.params.id;

	const items = await pgClient.query('SELECT * FROM items WHERE id = $1', [id])
	.catch(e => {
		res.status(500).send(`Could not find item with ID ${id}`);
	});

	res.status(200).send(items.rows);
});

app.post('/v1/items', async (req, res) => {
	const { item_name } = req.body;
	const id = uuid();
	const item = await pgClient.query(`INSERT INTO items (id, item_name, complete) VALUES ($1, $2, $3)`,
		[id, item_name, false])
	.catch(e => { res.status(500).send(`Could not create item`); });
	res.status(201).send(`Item created with ID ${id}`);
});

app.put('/v1/items/:id', async (req, res) => {
	const id = req.params.id;
	const { item_name, complete } = req.body;

	await pgClient.query(`UPDATE items SET item_name = $1, complete = $2 WHERE id = $3`,
		[item_name, complete, id])
	.catch(e => { res.status(500).send(`Could not update item with ID ${id}`)});

	res.status(200).send(`Item updated with ID ${id}`);
});

app.delete('/v1/items/:id', async (req, res) => {
	const id = req.params.id;

	await pgClient.query('DELETE FROM items WHERE id = $1', [id])
	.catch(e => { res.status(500).send(`Could not delete item with ID ${id}`)});

	res.status(200).send(`Item deleted with ID ${id}`);
});

const port = process.env.PORT || 3001;
const server = http.createServer(app);
server.listen(port, () => console.log(`Server running on port ${port}`));

