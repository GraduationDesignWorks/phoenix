import isEmpty from 'lodash/isEmpty'

import db from './db'
import model from '../model'

const tokenValidator = (req, res, next) => {
  const { authorization: token } = req.headers
  model.token.findOne({ token })
  .then(tokenInfo => {
    if (isEmpty(tokenInfo)) {
      res.send({ error: 'token不能为空' })
    } else {
      const { account } = tokenInfo
        req.params.account = account
        next()
    }
  })
  .catch(error => res.send({ error }))
}

export {
  tokenValidator,
}