import express from 'express'
import {
  isEmpty,
  isFunction,
} from 'lodash'

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
    imagesJSONString = "",
  } = req.body
  let { images } = req.body
  if (isEmpty(images)) {
    if (isEmpty(imagesJSONString)) {
      images = []
    } else {
      images = JSON.parse(imagesJSONString)
    }
  }

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

// 评论某个timeline
router.post('/comment', tokenValidator, (req, res) => {
  const { account } = req.params
  const {
    timelineID,
    content,
  } = req.body

  if (isEmpty(content)) {
    return res.send({ error: '评论不可为空' })
  }

  const queries = [
    model.timeline.findById(timelineID),
    model.user.findOne({ account }),
  ]
  Promise.all(queries)
  .then(queryItems => {
    const [ timeline, user, replyUser = {} ] = queryItems
    if (isEmpty(timeline)) {
      res.send({ error: '未找到timeline' })
    } else {
      const comment = new model.comment({
        authorAccount: timeline.account,
        account,
        name: user.name,
        timelineID,
        content,
        publishDate: new Date(),
      })
      comment.save()
      .then(() => res.send({ success: true }))
      .catch(error => res.send({ error }))
    }
  })
  .catch(error => res.send({ error }))
})

const queryTimelines = ({
  viewerAccount,
  account,
  accounts,
  successHandler,
  errorHandler
}) => {
  const queryAccounts = isEmpty(accounts) ? [account] : accounts
  if (isEmpty(queryAccounts)) {
    return errorHandler('account should not be empty')
  }

  const queries = [
    model.user.find({ account: { $in: queryAccounts } }),
    model.timeline.find({ account: { $in: queryAccounts } }).sort([['publishDate', 'descending']]),
    model.comment.find({ authorAccount: { $in: queryAccounts } }),
    model.like.find({ authorAccount: { $in: queryAccounts } }),
  ]

  Promise.all(queries)
  .then(queryItems => {
    const [ users, timelines, comments, likes ] = queryItems

    // comment
    const commentMap = {}
    comments.map(comment => {
      const { timelineID } = comment
      const commentArray = commentMap[timelineID] || []
      commentArray.push(comment)
      commentMap[timelineID] = commentArray
    })

    // like
    const likeMap = {}
    likes.map(like => {
      const { timelineID } = like
      const likeArray = likeMap[timelineID] || []
      likeArray.push(like)
      likeMap[timelineID] = likeArray
    })

    const result = timelines.map(raw => {
      const timeline = raw.toJSON()
      const userAccount = timeline.account
      const [user] = users.filter(user => user.account === userAccount)
      timeline.user = formatedUserInfo({ user })

      timeline.comments = commentMap[timeline._id] || []

      const likes = likeMap[timeline._id] || []
      timeline.likes = likes
      timeline.liked = likes.map(like => like.account).includes(viewerAccount)
      return timeline
    })
    if (isFunction(successHandler)) {
      successHandler(result)
    }
  })
  .catch(error => {
    if (isFunction(errorHandler)) {
      errorHandler(error)
    }
  })
}

/**
 * 根据用户关注的人获取timeline
 */
router.get('/getFollowingTimelines', tokenValidator, (req, res) => {
  const { account: viewerAccount } = req.params

  model.follow.find({ follower: viewerAccount })
  .then(followingResult => {
    const accounts = followingResult.map(result => result.following)
    accounts.push(viewerAccount)
    queryTimelines({
      viewerAccount,
      accounts,
      successHandler: result => res.send({ result }),
      errorHandler: error => res.send({ error })
    })
  })
  .catch(error => {
    if (isFunction(errorHandler)) {
      errorHandler(error)
    }
  })

})

/**
 * 根据用户获取timeline
 */
router.get('/getByUser', tokenValidator, (req, res) => {
  const { account: viewerAccount } = req.params
  const { account } = req.query

  queryTimelines({
    viewerAccount,
    account,
    successHandler: result => res.send({ result }),
    errorHandler: error => res.send({ error })
  })
})

router.get('/getTimelines', tokenValidator, (req, res) => {
  const { lastTimelineID } = req.query
  const { account: viewerAccount } = req.params
  const { amount = 30 } = req.query

  model.timeline.find().sort([['publishDate', 'descending']])
  .then(timelines => {
    const result = []
    if (isEmpty(lastTimelineID)) {
      for(let i = 0; i < timelines.length; i++) {
        const timeline = timelines[i]
        if (result.length === amount) {
          break
        }
        if (result.length < amount) {
          result.push(timeline)
        }
      }
    } else {
      let found = false
      for(let i = 0; i < timelines.length; i++) {
        const timeline = timelines[i]
        if (result.length === amount) {
          break
        }
        if (found && result.length < amount) {
          result.push(timeline)
        }
        if (timeline._id.toString() === lastTimelineID) {
          found = true
        }
      }
    }

    const queryAccounts = []
    result.forEach(function(element) {
      queryAccounts.push(element.account)
    }, this)

    const queries = [
      model.user.find({ account: { $in: queryAccounts } }),
      model.comment.find({ authorAccount: { $in: queryAccounts } }),
      model.like.find({ authorAccount: { $in: queryAccounts } }),
    ]

    Promise.all(queries)
    .then(queryItems => {
      const [ users, comments, likes ] = queryItems
      // comment
      const commentMap = {}
      comments.map(comment => {
        const { timelineID } = comment
        const commentArray = commentMap[timelineID] || []
        commentArray.push(comment)
        commentMap[timelineID] = commentArray
      })

      // like
      const likeMap = {}
      likes.map(like => {
        const { timelineID } = like
        const likeArray = likeMap[timelineID] || []
        likeArray.push(like)
        likeMap[timelineID] = likeArray
      })

      res.send({
        result: result.map(raw => {
          const timeline = raw.toJSON()
          const userAccount = timeline.account
          const [user] = users.filter(user => user.account === userAccount)
          timeline.user = formatedUserInfo({ user })

          timeline.comments = commentMap[timeline._id] || []

          const likes = likeMap[timeline._id] || []
          timeline.likes = likes
          timeline.liked = likes.map(like => like.account).includes(viewerAccount)
          return timeline
        })
      })
    })
    .catch(error => {
      console.warn(error)
      res.send({ error })
    })
  })
  .catch(error => {
    console.warn(error)
    res.send({ error })
  })
})

export default router