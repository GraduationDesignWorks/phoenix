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

// 点赞/取消赞
router.post('/like', tokenValidator, (req, res) => {
  const { account } = req.params
  const { timelineID } = req.body

  const queries = [
    model.like.find({ timelineID }),
    model.timeline.findById(timelineID),
    model.user.findOne({ account }),
  ]

  Promise.all(queries)
  .then(queryItems => {
    const [ likes, timeline, user ] = queryItems
    if (isEmpty(timeline)) {
      res.send({ error: '未找到timeline' })
    } else {
      const liked = likes.map(like => like.account).includes(account)
      if (liked) {
        // 取消点赞
        model.like.findOneAndRemove({ timelineID, account })
        .then(() => res.send({ success: true }))
        .catch(error => res.send)
      } else {
        // 点赞
        const like = new model.like({
          authorAccount: timeline.account,
          account,
          avatar: user.avatar,
          name: user.name,
          timelineID,
          publishDate: new Date()
        })
        like.save()
        .then(() => res.send({ success: true }))
        .catch(error => res.send({ error }))
      }
    }
  })
  .catch(error => res.send({ error }))
})

export default router