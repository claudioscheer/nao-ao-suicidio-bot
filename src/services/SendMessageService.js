import rp from 'request-promise';

import config from '../../config.json';
import SenderActions from '../helper/SenderActions';
import witAiService from '../services/WitAiService';

const urlMessage = 'https://graph.facebook.com/v2.6/me/messages';

class SendMessageService {

	async sendPost(data) {
		return await rp({
			url: urlMessage,
			qs: {
				access_token: config.accessToken,
			},
			method: 'POST',
			json: data,
		});

	}

	async sendSenderAction(recipient, action) {
		return await this.sendPost({
			recipient: {
				id: recipient,
			},
			sender_action: action,
		});
	}

	async sendMessage(recipient, message) {
		return await this.sendPost({
			recipient: {
				id: recipient,
			},
			message,
		});
	}

	async onReceiveMessage(message) {
		const recipient = message.sender.id;
		await this.sendSenderAction(recipient, SenderActions.MARK_SEEN);
		await this.sendSenderAction(recipient, SenderActions.TYPING_ON);

		const intent = await witAiService.messageInterpreter(message.message.text);
		const messageObject = this.getMessageToIntent(intent);
		await this.sendMessage(recipient, messageObject);
	}

	getMessageToIntent(intent) {
		if (intent === 'hello') {
			return {
				text: 'Olá do Bot.',
			};
		}
	}

}

const sendMessageService = new SendMessageService();
export default sendMessageService;