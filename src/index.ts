import * as dgram from 'dgram'
import * as dnsPacket from 'dns-packet'

const server = dgram.createSocket('udp4')

const db: {
  [key: string]: {
    type: string
    data: string
  }
} = {
  'dsandev.in': {
    type: 'CNAME',
    data: 'dsandev.vercel.app',
  },
  'dsandev.vercel.app': {
    type: 'A',
    data: '4.5.6.7',
  },
}

server.on('message', (msg, rinfo) => {
  const incomingRequest = dnsPacket.decode(msg)
  console.log({
    questions: incomingRequest.questions,
    rinfo,
  })

  if (incomingRequest.questions && incomingRequest.questions.length > 0) {
    const ipFromDb = db[incomingRequest.questions[0].name]
    const answer = dnsPacket.encode({
      type: 'response',
      id: incomingRequest.id,
      flags: dnsPacket.AUTHORITATIVE_ANSWER,
      questions: incomingRequest.questions,
      answers: [
        {
          type: ipFromDb.type as 'CNAME' | 'A',
          name: incomingRequest.questions[0].name,
          ttl: 300,
          class: 'IN',
          data: ipFromDb.data,
        },
      ],
    })
    server.send(answer, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error('Error sending response to client:', err)
      } else {
        console.log('Sent response to client:', answer)
      }
    })
  } else {
    console.log('No questions found in the incoming request')
  }
})

server.on('error', (err) => {
  console.error('Server error:', err)
})

server.bind(53, () => console.log('DNS Server is running on port 53'))
