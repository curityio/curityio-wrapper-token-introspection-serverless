const jose = require('jose');
const axios = require('axios');

const generatePolicy = (principalId, effect, resource, issuer) => {
  var authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: effect,
          Resource: resource,
          Action: 'execute-api:Invoke'
        }
      ]
    };
    authResponse.policyDocument = policyDocument;
  }
  authResponse.context = {
    issuer: issuer
  };
  console.debug(JSON.stringify(authResponse));
  return authResponse;
};

exports.handler = async (event, context, callback) => {
  console.debug('Authorizer: Handler function invoked ');

  const issuerWhiteList = process.env.TRUSTED_ISSUERS.trim().split(',');
  const audienceWhiteList = process.env.TRUSTED_AUDIENCES.trim().split(',');

  console.debug(`Authorizer: Issuers whitelist: ${issuerWhiteList}`);
  console.debug(`Authorizer: Audience whitelist: ${audienceWhiteList}`);

  // Get Wrapper token from the authorization header
  const wrapperAccessToken = event.authorizationToken;

  try {
    // Extract issuer
    const unVerifiedJWT = jose.decodeJwt(wrapperAccessToken);
    const issuer = unVerifiedJWT.iss;
    console.debug(`Authorizer: Issuer fetched from the token : ${issuer}`);

    const audience = unVerifiedJWT.aud;
    console.debug(`Authorizer: Audience fetched from the token : ${audience}`);

    // Verify whether the issuer is trusted
    if (!issuerWhiteList.includes(issuer)) {
      console.debug('Authorizer: Issuer is not trusted, discarding the token');
      callback('Authorizer: Error: Invalid Token');
    }

    if (!audienceWhiteList.includes(audience)) {
      console.debug('Authorizer: Audience is not trusted, discarding the token');
      callback('Authorizer: Error: Invalid Token');
    }

    const response = await axios.get(`${issuer}/.well-known/openid-configuration`);
    console.debug(`Authorizer: JWKS URI : ${response.data.jwks_uri}`);

    // Verify Wrapper token jwt
    const JWKS = jose.createRemoteJWKSet(new URL(response.data.jwks_uri));
    await jose.jwtVerify(wrapperAccessToken, JWKS, {});
    console.debug('Authorizer: Wrapper token validation is successful');
    // Return the Policy object
    callback(null, generatePolicy('userId', 'Allow', event.methodArn, issuer));
    console.debug('Authorizer: handler function completed');
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
    callback(null, generatePolicy('userId', 'Deny', event.methodArn));
  }
};
