import assert from 'assert';
import {
    Wit,
    log,
} from 'node-wit';

import config from '../config.json';

describe('WitAi', () => {
    it('should return intent hello', async function () {
        const client = new Wit({
            accessToken: config.witAiToken,
            // logger: new log.Logger(log.DEBUG),
        });
        const response = await client.message('oi');
        assert.equal(response.entities.intent[0].value, 'hello');
    });
});