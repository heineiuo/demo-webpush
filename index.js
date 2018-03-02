/**
 * @reference
 * firebase接口协议列表 https://firebase.google.com/docs/cloud-messaging/server
 * firebase新版协议 https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
 * googleapi获取access_token https://firebase.google.com/docs/cloud-messaging/auth-server
 * firebase项目地址 https://console.firebase.google.com/project/naodong-9d2b8/overview
 * firebase 发送消息 https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send
 * gcm_sender_id 是一个固定值 https://firebase.google.com/docs/cloud-messaging/js/client#configure_the_browser_to_receive_messages
 */

require('dotenv').config()
const {
  PROJECT_ID,
  PORT
} = process.env

const fs = require('fs')
const express = require('express')
const morgan = require('morgan')
const fetch = require('node-fetch')

const HttpsProxyAgent = require('https-proxy-agent')
const agent = new HttpsProxyAgent(process.env.HTTP_PROXY)
const { GoogleToken } = require('gtoken-china')

// const axios = require('axios')
// axios.defaults.httpsAgent = agent
// const { GoogleToken } = require('gtoken')


const key = JSON.parse(fs.readFileSync(__dirname + '/service-account.json', 'utf8'))

const gtoken = new GoogleToken({
  agent,
  iss: key.client_email,
  // sub: 'heineiuo@gmail.com',
  scope: [
    // 'https://www.googleapis.com/auth/plus.me',
    // 'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/firebase.messaging'
  ],
  // keyFile: __dirname + '/service-account.json',
  key: key.private_key,
  // additionalClaims: params.additionalClaims
})


const app = express()
app.use(morgan('dev'))
app.use(express.json())

app.post('/send-push', async (req, res, next) => {
  try {
    const { clientToken, notification } = req.body
    const accessToken = await gtoken.getToken()

    const fetchRes = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
      agent,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      body: JSON.stringify({
        validate_only: false,
        message: {
          token: clientToken,
          notification
        }
      })
    })

    const fetchJson = await fetchRes.json()
    res.json(fetchJson)

  } catch (e) {
    next(e)
  }

})

app.use(express.static(__dirname + '/public'))

app.use((err, req, res, next) => {
  console.log(err)
  // console.log(`${err.name} ${err.massage} ${err.stack}`)
  res.sendStatus(500)
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})