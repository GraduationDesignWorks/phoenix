import express from 'express'
import isEmpty from 'lodash/isEmpty'

import { tokenValidator } from '../../lib/routerMiddlewares'
import {
  formatedUserInfo,
  imageUploadInfo,
} from '../../lib/util'
import db from '../../lib/db'
import model from '../../model'

const router = express.Router()

router.get('/getImageUploadInfo', tokenValidator, (req, res) => {
  const { account } = req.params
  const { amount = 0 } = req.query
  if (amount !== 0) {
    const result = imageUploadInfo(account, amount)
    res.send({ result })
  } else {
    res.send({ error: 'amount参数错误' })
  }
})

router.post('/postTimeline', tokenValidator, (req, res) => {
  const { account } = req.params
  const {
    content = '',
    images = [],
  } = req.body

  const timeline = new model.timeline({
    account,
    content,
    publishDate: new Date(),
    images,
  })

  timeline.save()
  .then(() => res.send({ success: true }))
  .catch(error => res.send({ error }))
})

router.post('/deleteTimeline', tokenValidator, (req, res) => {
  const { account } = req.params
  const { timelineID } = req.body

  model.timeline.findById(timelineID)
  .then(timeline => {
    if (isEmpty(timeline)) {
      return res.send({ error: '未找到timeline' })
    }
    const { account: authorAccount } = timeline
    if (authorAccount === account) {
      model.timeline.findOneAndRemove({ _id: timelineID })
      .then(() => res.send({ success: true }))
      .catch(error => res.send({ error }))
    } else {
      res.send({ error: '非法操作：不能删除非自己的分享' })
    }
  })
  .catch(error => res.send({ error }))
})

export default router