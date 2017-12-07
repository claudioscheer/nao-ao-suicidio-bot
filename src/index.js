import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';

import config from "../config.json";
import sendMessageService from './services/SendMessageService';

const
	APP_SECRET = config.appSecret,
	VERIFY_TOKEN = config.verifyToken,
	ACCESS_TOKEN = config.accessToken;

if (!(APP_SECRET && VERIFY_TOKEN && ACCESS_TOKEN && config.witAiToken)) {
	console.error('Missing config values.');
	process.exit(1);
}

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ verify: verifyRequestSignature }));

app.get('/webhook', (req, res) => {
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
		console.log('Validating webhook.');
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error('Failed validation. Make sure the validation tokens match.');
		res.sendStatus(403);
	}
});

app.post('/webhook', (req, res) => {
	try {
		const data = req.body;
		switch (data.object) {
			case 'page':
				processPageEvents(data);
				break;

			case 'group':
				processGroupEvents(data);
				break;

			case 'workplace_security':
				processWorkplaceSecurityEvents(data);
				break;

			default:
				console.log('Unhandled Webhook Object', data.object);
		}
	} catch (e) {
		console.error(e);
	} finally {
		res.sendStatus(200);
	}
});

const processPageEvents = (data) => {
	data.entry.forEach((entry) => {
		const page_id = entry.id;
		// Chat messages sent to the page.
		if (entry.messaging) {
			entry.messaging.forEach(async (messaging_event) => {
				await sendMessageService.onReceiveMessage(messaging_event);
			});
		}
		// Page related changes, or mentions of the page.
		if (entry.changes) {
			entry.changes.forEach((change) => {
				console.log('Page Change', page_id, change);
			});
		}
	});
}

const processGroupEvents = (data) => {
	data.entry.forEach((entry) => {
		let group_id = entry.id;
		entry.changes.forEach((change) => {
			console.log('Group Change', group_id, change);
		});
	});
}

const processWorkplaceSecurityEvents = (data) => {
	data.entry.forEach((entry) => {
		let group_id = entry.id;
		entry.changes.forEach((change) => {
			console.log('Workplace Security Change', group_id, change);
		});
	});
}

const verifyRequestSignature = (req, res, buf) => {
	const signature = req.headers['x-hub-signature'];
	if (!signature) {
		console.error('Couldn\'t validate the signature.');
	} else {
		const elements = signature.split('=');
		const signatureHash = elements[1];
		const expectedHash = crypto.createHmac('sha1', APP_SECRET).update(buf).digest('hex');
		if (signatureHash !== expectedHash) {
			throw new Error('Couldn\'t validate the request signature.');
		}
	}
}

const port = config.port || 3000;
app.listen(port, () => {
	console.log(`App listening on port ${port}.`);
});