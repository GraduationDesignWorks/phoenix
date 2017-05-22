import utils from 'utility'
import rand from 'csprng'
import qiniu from 'qiniu'

import { qiniuCfg } from '../config'

qiniu.conf.ACCESS_KEY = qiniuCfg.accessKey
qiniu.conf.SECRET_KEY = qiniuCfg.secretKey

const formatedUserInfo = ({
  user,
  followings = [],
  followers = [],
  following = false,
}) => {
  const {
    account,
    name,
    avatar,
    motto,
  } = user
  return {
    account,
    name,
    avatar,
    motto,
    following,
    followings,
    followers,
  }
}

const avatarUploadInfo = account => {
  const dateString = ((new Date()).getTime()).toString()

  const accountPart = utils.sha1(account, 'base64')
  const datePart = utils.sha1(dateString, 'base64')
  const randomPart = rand(80, 36)

  const key = `${randomPart}${accountPart}${datePart}`
  const putPolicy = new qiniu.rs.PutPolicy(`${qiniuCfg.bucket}:${key}`)
  return {
    token: putPolicy.token(),
    key,
  }
}

const imageUploadInfo = (account, amount) => {
  const result = []
  const dateString = ((new Date()).getTime()).toString()
  const accountPart = utils.sha1(account, 'base64')
  const datePart = utils.sha1(dateString, 'base64')

  for (let i = 0; i < amount; i++) {
    const randomPart = rand(80, 36)

    const key = `${randomPart}${accountPart}${datePart}${i}`
    const putPolicy = new qiniu.rs.PutPolicy(`${qiniuCfg.bucket}:${key}`)
    result.push({
      token: putPolicy.token(),
      key,
    })
  }
  return result
}

export {
  formatedUserInfo,
  avatarUploadInfo,
  imageUploadInfo,
}