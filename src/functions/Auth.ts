import { URLSearchParams } from 'url'
import { APIGatewayAuthorizerResult, APIGatewayAuthorizerResultContext } from 'aws-lambda'
import jwt from 'jsonwebtoken'
import jwkToPem from 'jwk-to-pem'
import fetch, { RequestInit } from 'node-fetch'

const issuer = `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_POOL_ID}`
let jwksJSON: any
const verifyJWT = async (token: string, type: 'id' | 'access'): Promise<any> => {
  if (!jwksJSON) {
    const jwksResponse = await fetch(`${issuer}/.well-known/jwks.json`)
    jwksJSON = await jwksResponse.json()
    if (jwksJSON.error) {
      throw { message: `JWKS origin returned an error: ${jwksJSON.error}` }
    }
  }
  const keyIndex = type === 'id' ? 0 : 1
  const pem = jwkToPem({
    kty: jwksJSON.keys[keyIndex].kty,
    n: jwksJSON.keys[keyIndex].n,
    e: jwksJSON.keys[keyIndex].e,
  })
  const decoded: any = jwt.verify(token, pem, { issuer })
  if (decoded[type === 'id' ? 'aud' : 'client_id'] !== process.env.AUTH_CLIENT_ID) {
    throw { message: `Token (${type}) audience does not match the client id.` }
  }
  return decoded
}

const getTokens = async (body: any): Promise<any> => {
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body)
  }
  const tokenResponse = await fetch(`${process.env.AUTH_URL}/oauth2/token`, options)
  const tokenJSON = await tokenResponse.json()
  if (tokenJSON.error) {
    throw { message: `/oauth2/token returned an error: ${tokenJSON.error}` }
  }
  return tokenJSON
}


// Helper function to generate an IAM policy
const generatePolicy = (principalId: string, effect: string, resource: string, context?: APIGatewayAuthorizerResultContext): APIGatewayAuthorizerResult => {
  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: []
    }
  }

  if (effect && resource) {
    authResponse.policyDocument.Statement.push({
      Effect: effect,
      Resource: resource,
      Action: 'execute-api:Invoke'
    })
  }

  // Optional output with custom properties
  if (context) authResponse.context = context

  return authResponse
}

export const Authorize = async (event: any): Promise<APIGatewayAuthorizerResult> => {
  if (!event.authorizationToken) return generatePolicy('guest', 'Deny', event.methodArn)

  const refreshToken = event.authorizationToken.substring(7)
  if (!refreshToken) return generatePolicy('guest', 'Deny', event.methodArn)

  const tokens = await getTokens({
    grant_type: 'refresh_token',
    client_id: process.env.AUTH_CLIENT_ID,
    refresh_token: refreshToken,
    redirect_uri: `${process.env.APP_URL}${event.resource}`
  })

  const idToken = await verifyJWT(tokens.id_token, 'id')

  return generatePolicy(idToken.email, 'Allow', event.methodArn, {
    email: idToken.email,
    givenName: idToken.given_name,
    familyName: idToken.family_name,
    picture: idToken.picture
  })
}