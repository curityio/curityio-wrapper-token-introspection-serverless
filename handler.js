/*
 *  Copyright 2023 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const axios = require('axios');

module.exports.introspectWrapperTokens = async (event, context, callback) => {
  console.debug('Handler: introspectWrapperTokens invoked');
  // get issuer from the context
  const issuer = event.requestContext.authorizer.issuer;
  console.debug(`Handler: Issuer: ${issuer}`);

  try {
    // get token introspection endpoint
    const response = await axios.get(`${issuer}/.well-known/openid-configuration`);
    console.debug(`Handler: Token Introspection endpoint: ${response.data.introspection_endpoint}`);

    //Base64 encode client_id and client_secret to authenticate to token introspection endpoint
    const basic_auth_header = Buffer.from(`${process.env.CLIENT_ID.trim()}:${process.env.CLIENT_SECRET.trim()}`, 'utf-8').toString('base64');

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

    // call introspection endpoint
    const introspectionResponse = await axios.post(response.data.introspection_endpoint, requestData, options);
    console.debug('Handler: introspectWrapperTokens completed');

    // return introspected JWT
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          token: introspectionResponse.data
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
    } else if (error.request) {
      // The request was made but no response was received
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Handler: Error : ', error.message);
    }
    console.error(error.config);
  }
};
