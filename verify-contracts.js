const https = require('https');

const CONTRACTS = {
  POAP: '0x323A6ddC3390192013bfe09Ea7d677c7469078c4',
  EVENT_BADGE: '0xCB3c41286536004dee308520B4D1F64de20157DB',
  QR_VERIFICATION: '0x89dABaf2dC7aF4C06AF993E083115952cCd67E86',
  EVENT_FACTORY: '0x4FC9267E6Ef419be7700e3936Fc51D2835e257D0',
  MARKETPLACE: '0x072c6707E3fd1Bcc2f2177349402Ad5fdeB82F51',
  EVENT_MANAGER: '0x5876444b87757199Cd08f44193Bf7741FDA01EAD'
};

const checkContract = (address) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getCode',
      params: [address, 'latest'],
      id: 1
    });

    const options = {
      hostname: 'api.avax-test.network',
      path: '/ext/bc/C/rpc',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body).result;
        resolve(result !== '0x' && result.length > 2);
      });
    });

    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
};

(async () => {
  console.log('🔍 Verifying contracts on Fuji testnet...\n');
  
  for (const [name, address] of Object.entries(CONTRACTS)) {
    const deployed = await checkContract(address);
    console.log(`${deployed ? '✅' : '❌'} ${name.padEnd(20)} ${address}`);
  }
})();
