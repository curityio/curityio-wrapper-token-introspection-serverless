const axios = require('axios');

module.exports.introspectWrapperTokens = async (event, context, callback) => {
  console.log('Handler: introspectWrapperTokens invoked');
  // fetch issuer from the context
  const issuer = event.requestContext.authorizer.issuer;
  console.log(`Handler: Issuer: ${issuer}`);

  try {
    // fetch token endpoint
    const response = await axios.get(`${issuer}/.well-known/openid-configuration`);
    console.debug(`Handler: Token Introspection endpoint: ${response.data.introspection_endpoint}`);

    const basic_auth_header = Buffer.from(`${process.env.OAUTH2_INTROSPECTION_CLIENT_ID.trim()}:${process.env.OAUTH2_INTROSPECTION_CLIENT_SECRET.trim()}`, 'utf-8').toString(
      'base64'
    );

    const requestData = {
      token: event.headers.Authorization
    };

    const options = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/jwt',
        Authorization: `Basic ${basic_auth_header}`
      }
    };

    // call introspection method
    const IntrospectedJWTResponse = await axios.post(response.data.introspection_endpoint, requestData, options);
    console.log('Handler: introspectWrapperTokens completed');

    // return introspected JWT
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          token: IntrospectedJWTResponse.data
        },
        null,
        2
      )
    };
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error : ', error.message);
    }
    console.error(error.config);
  }
};
