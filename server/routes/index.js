import isEmpty from 'lodash/isEmpty'

import auth from './auth'
import timeline from './timeline'
import follow from './follow'

const routeItem = routeDic => {
  const key = Object.keys(routeDic)[0]
  const route = routeDic[key]
  return { key: `/${key}`, route }
}

export default [
  routeItem({ auth }),
  routeItem({ timeline }),
  routeItem({ follow }),
]
