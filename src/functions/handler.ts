import { Handler, Context } from 'aws-lambda'
import { Authorize } from './Auth'
import { connect, query, write } from './Database'
import { DeviceEvent } from './types'

export const auth: Handler = async (event: any, context: Context, callback: Function) => {
  console.log('context', context)
  try {
    const policy = await Authorize(event)
    return callback(policy)
  } catch (err) {
    return callback(err)
  }
}

export const deviceEvent: Handler = async (event: Required<DeviceEvent>) => {
  console.log('deviceEvent triggered')

  const client = await connect()
  await write(client?.db(), event.eventId, event)
  client?.close()
}

export const withings: Handler = async () => {
  console.log('Withings triggered')

  const client = await connect()
  await write(client?.db(), 'temp', { some: 'field', other: 123})
  await query(client?.db(), 'someColl', {other: 123})
    .then(response => console.log(response))
  client?.close()
}

