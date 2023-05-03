const tokenSchemaTemplate = {
  name: 'Test Token',
  protocolId: 'STAS-20',
  symbol: 'TESTTOKEN001', // REQUIRED
  description: 'This is a test token',
  image: 'Some Image URL',
  totalSupply: 10, // REQUIRED
  decimals: 0,
  satsPerToken: 1, // REQUIRED
  properties: {
    legal: {
      terms: 'STAS, Inc. retains all rights to the token script. Use is subject to terms at https://stastoken.com/license.',
      licenceId: 'stastoken.com',
    },
    issuer: {
      organisation: 'string',
      legalForm: 'string',
      governingLaw: 'string',
      issuerCountry: 'string',
      jurisdiction: 'string',
      email: 'string',
    },
    meta: {
      schemaId: 'STAS1.0',
      website: 'string',
      legal: {
        terms: 'string',
      },
      media: [
        {
          URI: 'string',
          type: 'string',
          altURI: 'string',
        },
      ],
    },
  },
};

module.exports = tokenSchemaTemplate