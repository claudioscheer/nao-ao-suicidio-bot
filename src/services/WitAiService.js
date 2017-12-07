import {
    Wit,
    log,
} from 'node-wit';

import config from '../../config.json';

class WitAiService {

    constructor() {
        this.witAiClient = new Wit({
            accessToken: config.witAiToken,
            logger: new log.Logger(log.DEBUG),
        });
    }

    async messageInterpreter(message) {
        const response = await this.witAiClient.message(message);
        return response.entities.intent[0].value;
    }
}

const witAiService = new WitAiService();
export default witAiService;