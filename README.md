# AWS Wrapper Token Introspection Lambda in a multi-tenant setup

[![Quality](https://img.shields.io/badge/quality-experiment-red)](https://curity.io/resources/code-examples/status/)
[![Availability](https://img.shields.io/badge/availability-source-blue)](https://curity.io/resources/code-examples/status/)

An AWS Lambda Authorizer and a backend lambda implementing the wrapper token introspection in a multi-tenant setup.

## Overview

The Curity Identity Server has great support for multi-tenancy. See [Running the Curity Identity Server in a multi-tenant architecture](https://curity.io/resources/learn/curity-multitenancy/) for more details.

This code example shows how to introspect tokens issued by various different tenants using a custom single token introspection endpoint.

## Configuration

`serverless.yml` provides few configuration options, namely : 

Parameter | Description |
--------- | ----------- |
profile | AWS profile to be used for aws credentials
region | AWS region to be used for lambda deployment
TRUSTED_ISSUERS | comma-separated white-list of accepted issuers permitted in the wrapper token
TRUSTED_AUDIENCES | comma-separated white-list of accepted audiences permitted in the wrapper token
CLIENT_ID | The client_id of an OAuth client with the `introspection` capability created in each profile
CLIENT_SECRET | The secret of an OAuth client with the `introspection` capability created in each profile

`use-wrapped-opaque-tokens` must also be enabled in the token issuer configuration in each profile in the Curity Identity Server.

## Deploying the code
[Serverless CLI](https://www.serverless.com/framework/docs/getting-started) must be installed before proceeding further. After the CLI is installed, run the following command to deploy the lambda code to AWS.

```bash
❯ sls deploy

Deploying wrapper-token-introspection-lambda to stage dev (eu-west-1)

✔ Service deployed to stack wrapper-token-introspection-lambda-dev (129s)

endpoint: POST - https://sh1nu2dqm7.execute-api.eu-west-1.amazonaws.com/dev/introspect
functions:
  authorizer: wrapper-token-authorizer (915 kB)
  wrapperTokenIntrospector: wrapper-token-introspector (915 kB)
```
Note the custom token introspection endpoint `https://sh1nu2dqm7.execute-api.eu-west-1.amazonaws.com/dev/introspect` in the deployment console output.

## Testing 

Run a `code` flow against any of the tenants and copy the issued wrapper access token. 
Now to introspect the wrapped access token, add it to the `Authorization` header and post it to the custom token introspection endpoint.
```bash
curl --location --request POST 'https://sh1nu2dqm7.execute-api.eu-west-1.amazonaws.com/dev/introspect' \
--header 'Authorization: eyJraWQiOiItNDQyODk4ODc5IiwieDV0IjoiaDdNMjZkSDVUQ2IwVkVLdHpHMkdZWnJrUEw4IiwiYWxnIjoiUlMyNTYifQ.eyJhdWQiOiJjbGllbnQtYnJhbmQyIiwiYXpwIjoiY2xpZW50LWJyYW5kMiIsImlzcyI6Imh0dHBzOi8vMGU1NC0yNDA1LTIwMS01YzBlLTM4MzktYmQ2Mi00ODEzLWU2OTctOGQzMC5pbi5uZ3Jvay5pby9icmFuZDIvb2F1dGgtYW5vbnltb3VzIiwiZXhwIjoxNjcyODU3MDc5LCJpYXQiOjE2NzI4NTM0NzksImp0aSI6IlAkN2VlOGUxMjgtYzlkZS00ZDc1LWFkNGUtNTMwYTBhNTVlMmZmIn0.Xbpk0HnJ1A7Pfn1fv1SUWvVHZSdBU0Zoox6GUEqgxqWcp8poK08AAq4sBqMqrTVh7wA9uZJwvdENNnW_LRzIWQjeriNtfeiZKAKxoz7sp6UYliPsYlxelML-e1_rA2ulBkQ-mJepzyr38F6HRCRA3FZqTpjl8aj8b8HEJ4j9P5rxfPLVnTn9ZdGyrQKyUO55-PYBqfym7oVhllxko40vPaxCHrW4YgeDA581-XRxrqhNFnkbergC8rzH3uAQl5X95Qn2r0EeAXj3EBEGA7Hlf1PMa6hCUtNeLtQsWtxVQw5lzmwbRF2XOeqQ-2RnLfi7cfhSoC1qDrwoRLaPwse8qQ'
```

Introspection response containing the JWT access token : 
```json
{
    "token": "eyJraWQiOiItNDQyODk4ODc5IiwieDV0IjoiaDdNMjZkSDVUQ2IwVkVLdHpHMkdZWnJrUEw4IiwiYWxnIjoiUlMyNTYifQ.eyJqdGkiOiIxYjk3NTk1MC05MDRlLTQ0ZmItYjM2OS0yZTZmMTcwMjc5Y2QiLCJkZWxlZ2F0aW9uSWQiOiI2YWIwNzEzMy1lYWEyLTQ4ODUtOWE3Ni01NjI0Y2Q4MDFjYmYiLCJleHAiOjE2NzI4NTcwNzksIm5iZiI6MTY3Mjg1MzQ3OSwic2NvcGUiOiJvcGVuaWQiLCJpc3MiOiJodHRwczovLzBlNTQtMjQwNS0yMDEtNWMwZS0zODM5LWJkNjItNDgxMy1lNjk3LThkMzAuaW4ubmdyb2suaW8vYnJhbmQyL29hdXRoLWFub255bW91cyIsInN1YiI6InN1cmVuMTAxIiwiYXVkIjoiY2xpZW50LWJyYW5kMiIsImlhdCI6MTY3Mjg1MzQ3OSwicHVycG9zZSI6ImFjY2Vzc190b2tlbiJ9.MrC1HciHxWJYP8oN1hHGTSEbDy2ATmb7AS-1z_gMUhbXJfYg4uD_AQCHbs3XJebyKQujg9h9JNM69EUtxewB5vu8Ankxh24CZXftnVD35w8dPw9rRnvcj57fzCcqgN5zlaccSevqjB1QrK8F9v5pXrZ_UUHLIbOy3zdyfo5nPvvj4vFgtXyM8KCiImXA1GpoXNoWe0s6oCtpBnSmC315vI4zQovlELsNglcv5YYuuIv5VnWXS0IvMh6tFoP7QPXkA7gANeZrH6TOgNJSppbM5rV2jDgc__aEjlX76UzBuU5HTUVzjp4uzVuys-ep5UBsmZ1F6Nzo-vE5Fzc4GdF2Qw"
}
```
So to summarize, wrapper access token issued from any of the tenant's token service can be introspected using a single introspection endpoint.

## clean up 

```bash
❯ sls remove
Removing wrapper-token-lambda from stage dev (eu-west-1)

✔ Service wrapper-token-lambda has been successfully removed (27s)
```

## More Information

* Please visit [curity.io](https://curity.io/) for more information about the Curity Identity Server.

Copyright (C) 2023 Curity AB.
